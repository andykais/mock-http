import { MockRequest, type MockRequestData } from './request_stub.ts'
import type {MockConfig} from './mock_http.ts'


class StubHttpBuilder {
  public mock_request: MockRequest
  public request_data: MockRequestData
  private response?: Response

  public constructor(
    private config: MockConfig,
    private method: MockRequestData['method'],
    private url: string
  ) {
    this.request_data = {
      method,
      url,
      headers: {},
      timeout_ms: this.config.default_timeout_ms
    }
    this.mock_request = new MockRequest(this.config, this.request_data)
  }

  public header(name: string, value: string) {
    this.request_data.headers[name] = value
    return this
  }

  public headers(headers: {[name: string]: string}) {
    for (const [name, value] of Object.entries(headers)) {
      this.request_data.headers[name] = value
    }
    return this
  }

  public timeout(timeout_ms: number) {
    this.request_data.timeout_ms = timeout_ms
    return this
  }

  public body(body: any) {
    this.request_data.body = body
  }

  public reply(response: Response) {
    this.response = response
    return this
  }

  public get_response() { return this.mock_request.mocked_request }
}

export { StubHttpBuilder }
