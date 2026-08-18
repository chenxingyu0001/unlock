import { doUnlock } from '../_api.js';

export async function onRequestGet(context) {
  const { env } = context;
  try {
    await doUnlock(env);
    return new Response(JSON.stringify({ code: 0, message: '开锁成功' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ code: -1, message: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}