// functions/api/unlock.js
import { encryptData_CBC } from '../../sm4.js';

// ---------- 基础配置 ----------
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Content-Type': 'application/json',
  systype: 'wechat',
  phonetype: 'microsoft',
  sysversion: 'Windows 10 x64',
};

function getTimeStr() {
  const d = new Date();
  return (
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') +
    String(d.getSeconds()).padStart(2, '0')
  );
}

// ---------- 获取验证码 ----------
async function getVerifyCode() {
  const randomint = String(Math.floor(100000 + Math.random() * 900000));
  const url = `https://lggafw.com/v1.5/spmj/login/randomImage/${randomint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: '{}',
  });
  const json = await res.json();
  const imgBase64 = json.message.replace('data:image/jpg;base64,', '');
  return { randomint, imgBase64 };
}

// ---------- OCR 识别（无鉴权） ----------
async function ocrCode(imgBase64, ocrUrl) {
  const res = await fetch(ocrUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ img_base64: imgBase64 }),
  });
  const json = await res.json();
  return json.result?.trim() || '';
}

// ---------- 登录 ----------
async function login(username, password, ocrUrl) {
  const ts = getTimeStr();
  const user = encryptData_CBC(username + ts);
  const pwd = encryptData_CBC(password + ts);
  const { randomint, imgBase64 } = await getVerifyCode();
  const captcha = await ocrCode(imgBase64, ocrUrl);

  const data = {
    identity: 'tenement',
    username: user,
    password: pwd,
    checkKey: randomint,
    captcha: captcha,
    openid: 'oSp4V0QSBh4SKPLbtSJcwrOmOm3s',
    phoneType: 'microsoft',
  };

  const res = await fetch('https://lggafw.com/v1.5/spmj/wechat/secure-login', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.token) throw new Error('登录失败：' + JSON.stringify(json));
  return json.token;
}

// ---------- 获取门禁信息 ----------
async function getBuildingInfo(token) {
  const res = await fetch(
    'https://lggafw.com/v1.5/spmj/buildings-doorDevice/page?page=0&size=20',
    {
      headers: { ...HEADERS, 'x-auth-token': token },
    }
  );
  const json = await res.json();
  if (!json.content) throw new Error('获取门禁信息失败');
  const first = json.content[0];
  const doorDevice = first?.doorDeviceYDtoList?.[0];
  return {
    buildingAddr: first?.buildingAddr || '未知地址',
    doorDeviceId: doorDevice?.id || 105839,
  };
}

// ---------- 执行开门 ----------
async function openDoor(token, doorDeviceId) {
  // 下发指令
  const openRes = await fetch('https://lggafw.com/v1.5/spmj/door/open-door', {
    method: 'POST',
    headers: { ...HEADERS, 'x-auth-token': token },
    body: JSON.stringify({ doorDeviceId }),
  });
  const openJson = await openRes.json();
  if (!openJson.id) throw new Error('开门指令下发失败');
  const commandId = openJson.id;

  // 轮询结果
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await fetch('https://lggafw.com/v1.5/spmj/door/open-door-result', {
      method: 'POST',
      headers: { ...HEADERS, 'x-auth-token': token },
      body: JSON.stringify({ commandId }),
    });
    const json = await res.json();
    if (json.hasResult) {
      if (json.message?.includes('成功') || json.hasResult) return;
      throw new Error(json.message || '设备返回错误');
    }
  }
  throw new Error('设备响应超时');
}

// ---------- Pages Function 入口 ----------
export async function onRequestPost({ request, env }) {
  const kv = env.unlock;
  try {
    // 1. 从 KV 读取配置（全部为纯字符串）
    const username = await kv.get('username');
    const password = await kv.get('password');
    const ocrUrl = await kv.get('ocrapi');
    if (!username || !password || !ocrUrl) {
      throw new Error('KV 中缺少必要配置（username/password/ocrapi）');
    }

    // 2. 尝试使用已有 token
    let token = null;
    const tokenRaw = await kv.get('token');
    if (tokenRaw) {
      try {
        const { token: t, expire } = JSON.parse(tokenRaw);
        if (expire > Date.now()) {
          // 验证 token 是否有效
          await getBuildingInfo(t);
          token = t;
        }
      } catch (_) { /* 忽略无效 token */ }
    }

    // 3. 若无有效 token，重新登录
    if (!token) {
      token = await login(username, password, ocrUrl);
      const expire = Date.now() + 2 * 60 * 60 * 1000; // 2 小时
      await kv.put('token', JSON.stringify({ token, expire }));
    }

    // 4. 获取设备 ID 及地址
    const { buildingAddr, doorDeviceId } = await getBuildingInfo(token);

    // 5. 开门
    await openDoor(token, doorDeviceId);

    // 6. 返回成功
    return new Response(
      JSON.stringify({ success: true, buildingAddr }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
