import { getInfo } from '../_api.js';

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const info = await getInfo(env);
    return new Response(JSON.stringify({ code: 0, address: info.address }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ code: -1, message: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
