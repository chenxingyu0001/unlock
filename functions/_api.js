import { encryptData_CBC, getTime } from '../_sm4.js';

const BASE_HEADERS = {
  "phonesnno": "484a522a-e52b-4308-8b2b-0c7eca68cf68",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "Content-Type": "application/json",
  "systype": "wechat",
  "xweb_xhr": "1",
  "phonetype": "microsoft",
  "sysversion": "Windows 10 x64",
  "Host": "lggafw.com",
  "Origin": "https://lggafw.com",
  "Referer": "https://lggafw.com/"
};

// 从 KV 获取所需配置
async function getConfig(env) {
  const username = await env.unlock.get('username');
  const password = await env.unlock.get('password');
  const token = await env.unlock.get('token');
  const ocrapi = await env.unlock.get('ocrapi'); 
  return { username, password, token, ocrapi };
}

// 请求图形验证码并调用 OCR 识别
async function getVerifyCodeAndOcr(ocrAuth) {
  const randomint = String(Math.floor(100000 + Math.random() * 900000));
  const url = `https://lggafw.com/v1.5/spmj/login/randomImage/${randomint}`;
  const res = await fetch(url, { method: 'POST', headers: BASE_HEADERS, body: '{}' });
  const json = await res.json();
  const img = json.message.replace("data:image/jpg;base64,", "");

  // 请求第三方 OCR 接口
  const ocrRes = await fetch("https://ocr.5555111.xyz/api/ocr/image", {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "accept": "application/json",
      "Authorization": "Basic " + btoa(ocrAuth)
    },
    body: JSON.stringify({ img_base64: img })
  });
  const ocrJson = await ocrRes.json();
  return { randomint, captcha: ocrJson.result?.trim() || "" };
}

// 登录获取 Token
async function login(env) {
  const { username, password, ocrapi } = await getConfig(env);
  if (!username || !password || !ocrapi) throw new Error("KV 配置不全");

  const ts = getTime();
  const user = encryptData_CBC(username + ts);
  const pwd = encryptData_CBC(password + ts);
  const { randomint, captcha } = await getVerifyCodeAndOcr(ocrapi);

  const data = {
    identity: "tenement", username: user, password: pwd,
    checkKey: randomint, captcha: captcha,
    openid: "oSp4V0QSBh4SKPLbtSJcwrOm3s", phoneType: "microsoft"
  };

  const res = await fetch("https://lggafw.com/v1.5/spmj/wechat/secure-login", {
    method: 'POST', headers: BASE_HEADERS, body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!json.token) throw new Error("自动登录失败，请检查密码或 OCR 接口");

  // 将新 Token 存入 KV
  await env.unlock.put('token', json.token);
  return json.token;
}

// 校验 Token 并获取门禁设备信息
async function getInfo(env) {
  let { token } = await getConfig(env);
  let doorDeviceId = await env.unlock.get('doorDeviceId');
  let address = "未知地址";

  const fetchInfo = async (tk) => {
    const res = await fetch("https://lggafw.com/v1.5/spmj/buildings-doorDevice/page?page=0&size=20", {
      headers: { ...BASE_HEADERS, "x-auth-token": tk }
    });
    return await res.json();
  };

  if (!token) token = await login(env);
  let json = await fetchInfo(token);

  // 如果 Token 失效，自动重新登录
  if (!json.content) {
    token = await login(env);
    json = await fetchInfo(token);
  }

  if (json.content && json.content.length > 0) {
    const firstBuilding = json.content[0];
    const doorDevice = firstBuilding?.doorDeviceYDtoList?.[0];
    address = firstBuilding?.buildingAddr || "未知地址";
    doorDeviceId = doorDevice?.id || 105839;
    
    // 缓存设备 ID 到 KV
    if (doorDeviceId && String(doorDeviceId) !== String(await env.unlock.get('doorDeviceId'))) {
      await env.unlock.put('doorDeviceId', String(doorDeviceId));
    }
  }

  return { address, doorDeviceId };
}

// 发送开门请求
async function doUnlock(env) {
  let { token } = await getConfig(env);
  let { doorDeviceId } = await getInfo(env);

  const sendOpen = async (tk) => {
    return await fetch("https://lggafw.com/v1.5/spmj/door/open-door", {
      method: 'POST',
      headers: { ...BASE_HEADERS, "x-auth-token": tk },
      body: JSON.stringify({ doorDeviceId: parseInt(doorDeviceId) })
    });
  };

  let openRes = await sendOpen(token);
  let openJson = await openRes.json();

  // 失效则重新登录重试
  if (!openJson.id) {
    token = await login(env);
    openRes = await sendOpen(token);
    openJson = await openRes.json();
  }
  if (!openJson.id) throw new Error("开门指令下发失败");
  
  const commandId = openJson.id;

  // 轮询结果 (为了防止边缘函数超时，循环限制为 10 次)
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const res = await fetch("https://lggafw.com/v1.5/spmj/door/open-door-result", {
      method: 'POST',
      headers: { ...BASE_HEADERS, "x-auth-token": token },
      body: JSON.stringify({ commandId })
    });
    const json = await res.json();

    if (json.hasResult) {
      if (json.message?.includes("成功") || json.hasResult) return;
      throw new Error(json.message || "设备返回错误");
    }
  }
  throw new Error("设备响应超时");
}

export { getInfo, doUnlock };