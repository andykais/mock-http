import { MockHttp } from '../mod.ts'
import { assertEquals } from "https://deno.land/std@0.138.0/testing/asserts.ts";


Deno.test('basic', async () => {
  const mock = new MockHttp()

  try {
    const stub_request = mock
      .get('https://google.com')
      .reply(new Response('im really google'))
      .get_response()

    const fetched_response = await fetch('https://google.com')

    const stub_response = await stub_request
    assertEquals(stub_response, fetched_response)

  } finally {
    mock.close()
  }
})
