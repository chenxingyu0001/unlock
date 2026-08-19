const CONFIG = {
  uname: "431281199907240215",
  pwd: "qq19990724",
  doorDeviceId: null,
  buildingAddr: "",

  headers: {
    phonesnno: "484a522a-e52b-4308-8b2b-0c7eca68cf68",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Content-Type": "application/json",
    systype: "wechat",
    xweb_xhr: "1",
    phonetype: "microsoft",
    sysversion: "Windows 10 x64",
	Host: "lggafw.com",
    Origin: "https://lggafw.com",
    Referer: "https://lggafw.com/",
  }
};

const LGMJ_KV = new EdgeKV({ namespace: 'LGMJ' });

// ====================== 核心优化：一次请求 = 校验Token + 拿地址/设备ID ======================
async function checkTokenAndGetInfo() {
  const token = localStorage.getItem("LGMJ_TOKEN");
  const LGMJ_USERNAME = await kv.get('LGMJ_USERNAME', { type: 'text' });
  console.log(LGMJ_USERNAME)
  if (LGMJ_USERNAME === undefined) { /* 不存在 */ }
  if (!token) return false;

  try {
    const res = await fetch(
      "https://lggafw.com/v1.5/spmj/buildings-doorDevice/page?page=0&size=20",
      { headers: { ...CONFIG.headers, "x-auth-token": token } }
    );
    const json = await res.json();

    // 1. 校验Token是否有效
    if (!json.content) return false;

    // 2. 自动解析地址 + 设备ID
    const firstBuilding = json.content[0];
    const doorDevice = firstBuilding?.doorDeviceYDtoList?.[0];

    CONFIG.buildingAddr = firstBuilding?.buildingAddr || "未知地址";
    CONFIG.doorDeviceId = doorDevice?.id || 105839;

    // 3. 渲染到页面
    document.getElementById("address").innerText = "🏠 " + CONFIG.buildingAddr;
    return true;

  } catch (e) {
    return false;
  }
}

// ====================== 初始化（只走一次） ======================
async function initTokenAndInfo() {
  const isValid = await checkTokenAndGetInfo();
  if (!isValid) {
    await login();
    await checkTokenAndGetInfo(); // 登录后再拿一次信息
  }
}

// ====================== 以下代码保持不变 ======================
function getTimeStr() {
  const d = new Date();
  return d.getFullYear() +
    ("0" + (d.getMonth() + 1)).slice(-2) +
    ("0" + d.getDate()).slice(-2) +
    ("0" + d.getHours()).slice(-2) +
    ("0" + d.getMinutes()).slice(-2) +
    ("0" + d.getSeconds()).slice(-2);
}

function encrypt(str) {
  return encryptData_CBC(str);
}

async function getVerifyCode() {
  const randomint = String(Math.floor(100000 + Math.random() * 900000));
  const url = `https://lggafw.com/v1.5/spmj/login/randomImage/${randomint}`;
  const res = await fetch(url, { method: 'POST', headers: CONFIG.headers, body: '{}' });
  const json = await res.json();
  const img = json.message.replace("data:image/jpg;base64,", "");
  return { randomint, img };
}

async function ocrCode(imgBase64) {
  const res = await fetch("https://ocr.5555111.xyz/api/ocr/image", {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      Authorization: "Basic " + btoa("qiyuechuanmei:qq19990724..")
    },
    body: JSON.stringify({ img_base64: imgBase64 })
  });
  const json = await res.json();
  return json.result?.trim() || "";
}

async function login() {
  const ts = getTimeStr();
  const user = encrypt(CONFIG.uname + ts);
  const pwd = encrypt(CONFIG.pwd + ts);
  const { randomint, img } = await getVerifyCode();
  const captcha = await ocrCode(img);

  const data = {
    identity: "tenement",
    username: user,
    password: pwd,
    checkKey: randomint,
    captcha: captcha,
    openid: "oSp4V0QSBh4SKPLbtSJcwrOmOm3s",
    phoneType: "microsoft"
  };

  const res = await fetch("https://lggafw.com/v1.5/spmj/wechat/secure-login", {
    method: 'POST',
    headers: CONFIG.headers,
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!json.token) throw new Error("登录失败：未获取到token");
  localStorage.setItem("LGMJ_TOKEN", json.token);
  return json.token;
}

async function doUnlock(onProgress) {
  const token = localStorage.getItem("LGMJ_TOKEN");
  if (!token) throw new Error("未登录，请刷新页面");

  onProgress("正在下发开门指令...");
  const openRes = await fetch("https://lggafw.com/v1.5/spmj/door/open-door", {
    method: 'POST',
    headers: { ...CONFIG.headers, "x-auth-token": token },
    body: JSON.stringify({ doorDeviceId: CONFIG.doorDeviceId })
  });
  const openJson = await openRes.json();
  if (!openJson.id) throw new Error("开门指令下发失败");
  const commandId = openJson.id;

  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    onProgress(`正在查询结果(${i+1}/15)...`);

    const res = await fetch("https://lggafw.com/v1.5/spmj/door/open-door-result", {
      method: 'POST',
      headers: { ...CONFIG.headers, "x-auth-token": token },
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
