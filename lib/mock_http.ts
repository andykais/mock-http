import * as std_mock from "https://deno.land/std@0.138.0/testing/mock.ts";
import * as errors from './errors.ts'
import { MockRequest, type MockRequestData } from './request_stub.ts'
import { StubHttpBuilder } from './request_stub_builder.ts'


interface MockOptions {
  allow_unstubbed_requests?: boolean
  default_timeout_ms?: number
}

type MockConfig = Required<MockOptions>

class MockHttp {

  public constructor(options?: MockOptions) {
    this.config = {
      allow_unstubbed_requests: options?.allow_unstubbed_requests ?? false,
      default_timeout_ms: options?.default_timeout_ms ?? 5000,
    }
  }

  public request(data: MockRequestData, response?: Response): Promise<Response> {
    const request_stub = new MockRequest(this.config, data, response)
    this.request_stubs.push(request_stub)
    return request_stub.mocked_request
  }

  public get = (url: string) => this.register_stub('GET', url)
  public put = (url: string) => this.register_stub('PUT', url)
  public post = (url: string) => this.register_stub('POST', url)
  public delete = (url: string) => this.register_stub('DELETE', url)

  private register_stub = (method: MockRequestData['method'], url: string) => {
    const request_stub_builder = new StubHttpBuilder(this.config, method, url)
    const request_stub = request_stub_builder.mock_request
    this.request_stubs.push(request_stub)
    return request_stub_builder
  }


  public close() {
    this.fetch_stub.restore()
  }

  private fetch_interceptor = async (input: string | URL | Request, options?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

    const request_data: MockRequestData = {
      method: options?.method ?? 'GET',
      url,
      headers: Object.fromEntries((options?.headers as any)?.entries() ?? []),
      body: options?.body,
      timeout_ms: -1, // we ignore this field for matching
    }
    for (const request_stub of this.request_stubs) {
      if (request_stub.match(request_data)) {
        request_stub.resolve()
        return request_stub.response
      }
    }
    if (this.config.allow_unstubbed_requests) {
      return this.fetch_unstubbed(url, options)
    } else {
      throw new errors.RequestNotMatched(`Request ${request_data.method} ${url} did not match any stubs`)
    }
  }

  private config: MockConfig
  private fetch_unstubbed = window.fetch
  private fetch_stub = std_mock.stub(window, "fetch", this.fetch_interceptor)
  private request_stubs: MockRequest[] = []

}

export { MockHttp }
export type { MockConfig }
