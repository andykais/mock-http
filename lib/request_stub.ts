import * as errors from './errors.ts'
import type {MockConfig} from './mock_http.ts'


interface MockRequestData {
  url: string
  method: string
  headers: {[name: string]: string}
  timeout_ms: number
  body?: BodyInit | null
}

class MockRequest {
  public resolve: () => void
  public reject: (e: Error) => void

  public readonly mocked_request: Promise<Response>
  public response: Response

  private request_start_at: number
  private timeout_id?: number

  public constructor(
    private config: MockConfig,
    private request_data: MockRequestData,
    response?: Response
  ) {
    this.response = response ?? new Response('', { status: 200 })
    this.resolve = () => { throw new Error('uninitialized') }
    this.reject = (e: Error) => { throw new Error('uninitialized') }

    this.mocked_request = new Promise((resolve, reject) => {
      this.resolve = () => {
        clearTimeout(this.timeout_id)
        resolve(this.response)
      }
      this.reject = (e: Error) => {
        clearTimeout(this.timeout_id)
        reject(e)
      }
    })

    this.request_start_at = performance.now()
    if (request_data.timeout_ms !== 0) {
      this.timeout_id = setTimeout(
        () => this.error_with_timeout(),
        request_data.timeout_ms
      )
    }
  }

  public set_timeout(timeout_ms: number) {
    this.request_data.timeout_ms = timeout_ms
    if (this.timeout_id) clearTimeout(this.timeout_id)

    // some funky logic to handle if somebody sets a timeout asynchronously
    const time_elapsed_ms = performance.now() - this.request_start_at
    this.timeout_id = setTimeout(
      () => this.error_with_timeout(),
      timeout_ms - time_elapsed_ms
    )
  }
  private error_with_timeout = () => {
    this.reject(new errors.TimeoutError(`request ${this.request_data.method} ${this.request_data.url} timed out after ${this.request_data.timeout_ms}ms`))
  }

  public match(request_data: MockRequestData) {
    if (this.request_data.url !== request_data.url) return false
    if (this.request_data.method !== request_data.method) return false
    if (this.request_data.headers !== undefined) {
      if (request_data.headers === undefined) return false
      for (const [name, value] of Object.entries(this.request_data.headers)) {
        if (request_data.headers[name] !== value) return false
      }
    }
    if (this.request_data.body !== undefined) {
      if (this.request_data.body instanceof ReadableStream) throw new Error('ReadableStream request body unimplemented')
      if (this.request_data.body instanceof URLSearchParams) throw new Error('URLSearchParams request body unimplemented')
      if (this.request_data.body && typeof this.request_data.body ===  'object' && 'new' in this.request_data.body) throw new Error('FormData request body unimplemented')
      if (this.request_data.body !== request_data.body) return false
    }
    return true
  }
}

export { MockRequest }
export type { MockRequestData }
