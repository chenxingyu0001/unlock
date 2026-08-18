function n() {
    this.sbox = new Array(214, 144, 233, 254, 204, 225, 61, 183, 22, 182, 20, 194, 40, 251, 44, 5, 43, 103, 154, 118, 42, 190, 4, 195, 170, 68, 19, 38, 73, 134, 6, 153, 156, 66, 80, 244, 145, 239, 152, 122, 51, 84, 11, 67, 237, 207, 172, 98, 228, 179, 28, 169, 201, 8, 232, 149, 128, 223, 148, 250, 117, 143, 63, 166, 71, 7, 167, 252, 243, 115, 23, 186, 131, 89, 60, 25, 230, 133, 79, 168, 104, 107, 129, 178, 113, 100, 218, 139, 248, 235, 15, 75, 112, 86, 157, 53, 30, 36, 14, 94, 99, 88, 209, 162, 37, 34, 124, 59, 1, 33, 120, 135, 212, 0, 70, 87, 159, 211, 39, 82, 76, 54, 2, 231, 160, 196, 200, 158, 234, 191, 138, 210, 64, 199, 56, 181, 163, 247, 242, 206, 249, 97, 21, 161, 224, 174, 93, 164, 155, 52, 26, 85, 173, 147, 50, 48, 245, 140, 177, 227, 29, 246, 226, 46, 130, 102, 202, 96, 192, 41, 35, 171, 13, 83, 78, 111, 213, 219, 55, 69, 222, 253, 142, 47, 3, 255, 106, 114, 109, 108, 91, 81, 141, 27, 175, 146, 187, 221, 188, 127, 17, 217, 92, 65, 31, 16, 90, 216, 10, 193, 49, 136, 165, 205, 123, 189, 45, 116, 208, 18, 184, 229, 180, 176, 137, 105, 151, 74, 12, 150, 119, 126, 101, 185, 241, 9, 197, 110, 198, 132, 24, 240, 125, 236, 58, 220, 77, 32, 121, 238, 95, 62, 215, 203, 57, 72),
        this.fk = new Array(2746333894, 1453994832, 1736282519, 2993693404), this.ck = new Array(462357, 472066609, 943670861, 1415275113, 1886879365, 2358483617, 2830087869, 3301692121, 3773296373, 4228057617, 404694573, 876298825, 1347903077, 1819507329, 2291111581, 2762715833, 3234320085, 3705924337, 4177462797, 337322537, 808926789, 1280531041, 1752135293, 2223739545, 2695343797, 3166948049, 3638552301, 4110090761, 269950501, 741554753, 1213159005, 1684763257);
}

function t() {
}

function r(n, t, r, e, h) {
    var l = h;
    l = t + h > n.length && e + h <= r.length ? n.length - t : e + h > r.length && t + h <= n.length ? r.length - e : t + h <= n.length && e + h <= r.length ? h : r.length < n.length ? r.length - e : n.length - e;
    for (var i = 0; i < l; i++) r[i + e] = n[i + t];
}

function e(n) {
    return new Array(n >> 24 & 255, n >> 16 & 255, n >> 8 & 255, 255 & n);
}

function h(n, t) {
    return t + 3 < n.length ? n[t] << 24 | n[t + 1] << 16 | n[t + 2] << 8 | n[t + 3] : t + 2 < n.length ? n[t + 1] << 16 | n[t + 2] << 8 | n[t + 3] : t + 1 < n.length ? n[t] << 8 | n[t + 1] : n[t];
}

n.prototype = {
    expandKey: function (n) {
        var t = new Array(36), r = function (n) {
            for (var t = Math.ceil(n.length / 4), r = new Array(t), e = 0; e < n.length; e++) n[e] = 255 & n[e];
            for (e = 0; e < r.length; e++) r[e] = h(n, 4 * e);
            return r;
        }(n);
        t[0] = r[0] ^ this.fk[0], t[1] = r[1] ^ this.fk[1], t[2] = r[2] ^ this.fk[2], t[3] = r[3] ^ this.fk[3];
        for (var e = new Array(32), l = 0; l < 32; l++) t[l + 4] = t[l] ^ this.T1(t[l + 1] ^ t[l + 2] ^ t[l + 3] ^ this.ck[l]),
            e[l] = t[l + 4];
        return e;
    },
    T1: function (n) {
        var t = new Array(4), r = new Array(4);
        this.PUT_ULONG_BE(n, r, 0), t[0] = this.sm4Sbox(r[0]), t[1] = this.sm4Sbox(r[1]),
            t[2] = this.sm4Sbox(r[2]), t[3] = this.sm4Sbox(r[3]);
        var e = this.GET_ULONG_BE(t, 0);
        return e ^ this.ROTL(e, 13) ^ this.ROTL(e, 23);
    },
    sm4Sbox: function (n) {
        var t = 255 & n, r = this.sbox[t];
        return r > 128 ? r - 256 : r;
    },
    GET_ULONG_BE: function (n, t) {
        return (255 & n[t]) << 24 | (255 & n[t + 1]) << 16 | (255 & n[t + 2]) << 8 | 255 & n[t + 3];
    },
    PUT_ULONG_BE: function (n, t, r) {
        var e = 255 & n >> 24, h = 255 & n >> 16, l = 255 & n >> 8, i = 255 & n;
        t[r] = e > 128 ? e - 256 : e, t[r + 1] = h > 128 ? h - 256 : h, t[r + 2] = l > 128 ? l - 256 : l,
            t[r + 3] = i > 128 ? i - 256 : i;
    },
    SHL: function (n, t) {
        return (4294967295 & n) << t;
    },
    ROTL: function (n, t) {
        return this.SHL(n, t) | n >> 32 - t;
    },
    sm4F: function (n, t, r, e, h) {
        return n ^ this.sm4Lt(t ^ r ^ e ^ h);
    },
    sm4Lt: function (n) {
        var t, r = new Array(4), e = new Array(4);
        return this.PUT_ULONG_BE(n, r, 0), e[0] = this.sm4Sbox(r[0]), e[1] = this.sm4Sbox(r[1]),
            e[2] = this.sm4Sbox(r[2]), e[3] = this.sm4Sbox(r[3]), (t = this.GET_ULONG_BE(e, 0)) ^ this.ROTL(t, 2) ^ this.ROTL(t, 10) ^ this.ROTL(t, 18) ^ this.ROTL(t, 24);
    },
    one_encrypt: function (n, t) {
        var r = new Array(36), e = 0, h = new Array(36);
        for (h[0] = this.GET_ULONG_BE(t, 0), h[1] = this.GET_ULONG_BE(t, 4), h[2] = this.GET_ULONG_BE(t, 8),
                 h[3] = this.GET_ULONG_BE(t, 12); e < 32;) h[e + 4] = this.sm4F(h[e], h[e + 1], h[e + 2], h[e + 3], n[e]),
            e++;
        return this.PUT_ULONG_BE(h[35], r, 0), this.PUT_ULONG_BE(h[34], r, 4), this.PUT_ULONG_BE(h[33], r, 8),
            this.PUT_ULONG_BE(h[32], r, 12), r;
    },
    T0: function (n) {
        var t = e(n), r = new Array(4);
        r[0] = this.sbox[255 & t[0]], r[1] = this.sbox[255 & t[1]], r[2] = this.sbox[255 & t[2]],
            r[3] = this.sbox[255 & t[3]];
        var l = h(r, 0);
        return l ^ (l << 2 | l >>> 30) ^ (l << 10 | l >>> 22) ^ (l << 18 | l >>> 14) ^ (l << 24 | l >>> 8);
    },
    pkcs7padding: function (n, t) {
        if (null == n) return null;
        var e = null;
        if (1 == t) {
            var h = 16 - n.length % 16;
            r(n, 0, e = new Array(n.length + h), 0, n.length);
            for (var l = 0; l < h; l++) e[n.length + l] = h;
        } else {
            h = n[n.length - 1];
            r(n, 0, e = new Array(n.length - h), 0, n.length - h);
        }
        return e;
    },
    encrypt_ecb: function (n, t) {
        if (null == n || null == n || n.length % 16 != 0) return null;
        if (null == t || null == t || t.length <= 0) return null;
        for (var e = this.expandKey(n), h = parseInt(t.length / 16), l = new Array(16 * (h + 1)), i = new Array(16), u = 0; u < h; u++) r(t, 16 * u, i, 0, 16),
            r(this.one_encrypt(e, i), 0, l, 16 * u, 16);
        var s = new Array(t.length % 16);
        s.length > 0 && r(t, 16 * h, s, 0, t.length % 16);
        var o = this.pkcs7padding(s, 1);
        return r(this.one_encrypt(e, o), 0, l, 16 * h, 16), l;
    },
    decrypt_ecb: function (n, t) {
        if (null == n || null == n || n.length % 16 != 0) return null;
        if (null == t || null == t || t.length % 16 != 0) return null;
        for (var e = this.expandKey(n), h = new Array(32), l = 0; l < e.length; l++) h[l] = e[32 - l - 1];
        var i, u = t.length / 16 - 1, s = new Array(16), o = null;
        r(t, 16 * u, s, 0, 16), o = this.one_encrypt(h, s);
        var a = this.pkcs7padding(o, 0);
        r(a, 0, i = new Array(16 * u + a.length), 16 * u, a.length);
        for (l = 0; l < u; l++) r(t, 16 * l, s, 0, 16), r(o = this.one_encrypt(h, s), 0, i, 16 * l, 16);
        return i;
    },
    encrypt_cbc: function (n, t, e) {
        if (null == n || null == n || n.length % 16 != 0) return null;
        if (null == e || null == e || e.length <= 0) return null;
        if (null == t || null == t || t.length % 16 != 0) return null;
        for (var h = this.expandKey(n), l = parseInt(e.length / 16), i = new Array(16 * (l + 1)), u = new Array(16), s = 0; s < l; s++) {
            r(e, 16 * s, u, 0, 16);
            for (var o = 0; o < 16; o++) u[o] = u[o] ^ t[o];
            r(t = this.one_encrypt(h, u), 0, i, 16 * s, 16);
        }
        var a = new Array(e.length % 16);
        a.length > 0 && r(e, 16 * l, a, 0, e.length % 16);
        var f = this.pkcs7padding(a, 1);
        for (s = 0; s < 16; s++) f[s] = f[s] ^ t[s];
        return r(t = this.one_encrypt(h, f), 0, i, 16 * l, 16), i;
    },
    decrypt_cbc: function (n, t, e) {
        if (null == n || null == n || n.length % 16 != 0) return null;
        if (null == e || null == e || e.length % 16 != 0) return null;
        if (null == t || null == t || t.length % 16 != 0) return null;
        for (var h = this.expandKey(n), l = new Array(32), i = 0; i < h.length; i++) l[i] = h[32 - i - 1];
        var u, s = e.length / 16, o = new Array(16), a = null;
        u = new Array(e.length);
        for (i = 0; i < s; i++) {
            r(e, 16 * i, o, 0, 16), a = this.one_encrypt(l, o);
            for (var f = 0; f < 16; f++) a[f] = a[f] ^ t[f];
            r(o, 0, t, 0, 16), r(a, 0, u, 16 * i, 16);
        }
        var c = this.pkcs7padding(a, 0), g = new Array(u.length - 16 + c.length);
        return r(u, 0, g, 0, u.length - 16), r(c, 0, g, u.length - 16, c.length), g;
    }
}, t.encode = function (n, t, r) {
    for (var e = new Array(2 * r), h = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"), l = t, i = 0; l < r + t; l++,
        i++) e[i] = h[(255 & n[l]) >> 4], e[++i] = h[15 & n[l]];
    return e.join("");
}, t.decode = function (n) {
    if (null == n || "" == n) return null;
    if (n.length % 2 != 0) return null;
    for (var t = n.length / 2, r = this.toCharCodeArray(n), e = new Array(t), h = 0; h < t; h++) {
        if (r[2 * h] >= 48 && r[2 * h] <= 57) e[h] = r[2 * h] - 48 << 4; else if (r[2 * h] >= 65 && r[2 * h] <= 70) e[h] = r[2 * h] - 65 + 10 << 4; else {
            if (!(r[2 * h] >= 97 && r[2 * h] <= 102)) return null;
            e[h] = r[2 * h] - 97 + 10 << 4;
        }
        if (r[2 * h + 1] >= 48 && r[2 * h + 1] <= 57) e[h] = e[h] | r[2 * h + 1] - 48; else if (r[2 * h + 1] >= 65 && r[2 * h + 1] <= 70) e[h] = e[h] | r[2 * h + 1] - 65 + 10; else {
            if (!(r[2 * h + 1] >= 97 && r[2 * h + 1] <= 102)) return null;
            e[h] = e[h] | r[2 * h + 1] - 97 + 10;
        }
    }
    return e;
}, t.utf8StrToHex = function (n) {
    for (var t = encodeURIComponent(n), r = unescape(t), e = r.length, h = [], l = 0; l < e; l++) h[l] = r.charCodeAt(l).toString(16);
    return h.join("");
}, t.utf8StrToBytes = function (n) {
    for (var t = encodeURIComponent(n), r = unescape(t), e = r.length, h = [], l = 0; l < e; l++) h[l] = r.charCodeAt(l);
    return h;
}, t.hexToUtf8Str = function (n) {
    for (var r = t.decode(n), e = [], h = 0; h < r.length; h++) e.push(String.fromCharCode(r[h]));
    return decodeURIComponent(escape(e.join("")));
}, t.bytesToUtf8Str = function (n) {
    for (var t = n, r = [], e = 0; e < t.length; e++) r.push(String.fromCharCode(t[e]));
    return decodeURIComponent(escape(r.join("")));
}, t.toCharCodeArray = function (n) {
    for (var t = new Array(n.length), r = 0; r < n.length; r++) t[r] = n.charCodeAt(r);
    return t;
}

function jiami() {
    this.secretKey = "D6B25F5A7FAD4CE59D00E52C30D39755", this.iv = "EDNEXSNE89EKL21B",
        this.encryptData_CBC = function (t) {
            var r = this.stringToByte(t), e = this.stringToByte(this.secretKey), h = this.stringToByte(this.iv),
                l = function (n) {
                    for (var t = "", r = 0; r < n.length; r += 3) for (var e = (255 & n[r]) << 16 | (255 & n[r + 1]) << 8 | 255 & n[r + 2], h = 0; h < 4; h++) r + .75 * h >= n.length ? t += "=" : t += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(e >>> 6 * (3 - h) & 63);
                    return t;
                }(new n().encrypt_cbc(e, h, r));
            return null != l && l.trim().length > 0 && l.replace(/(\s*|\t|\r|\n)/g, ""), l;
        }
    this.stringToByte = function (n) {
        var t, r, e = new Array();
        t = n.length;
        for (var h = 0; h < t; h++) (r = n.charCodeAt(h)) >= 65536 && r <= 1114111 ? (e.push(r >> 18 & 7 | 240),
            e.push(r >> 12 & 63 | 128), e.push(r >> 6 & 63 | 128), e.push(63 & r | 128)) : r >= 2048 && r <= 65535 ? (e.push(r >> 12 & 15 | 224),
            e.push(r >> 6 & 63 | 128), e.push(63 & r | 128)) : r >= 128 && r <= 2047 ? (e.push(r >> 6 & 31 | 192),
            e.push(63 & r | 128)) : e.push(255 & r);
        return e;
    };
}

function encryptData_CBC(t) {
    var r = this.stringToByte(t), e = this.stringToByte("D6B25F5A7FAD4CE59D00E52C30D39755"),
        h = this.stringToByte("EDNEXSNE89EKL21B"),
        l = function (n) {
            for (var t = "", r = 0; r < n.length; r += 3) for (var e = (255 & n[r]) << 16 | (255 & n[r + 1]) << 8 | 255 & n[r + 2], h = 0; h < 4; h++) r + .75 * h >= n.length ? t += "=" : t += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(e >>> 6 * (3 - h) & 63);
            return t;
        }(new n().encrypt_cbc(e, h, r));
    return null != l && l.trim().length > 0 && l.replace(/(\s*|\t|\r|\n)/g, ""), l;
}

this.stringToByte = function (n) {
    var t, r, e = new Array();
    t = n.length;
    for (var h = 0; h < t; h++) (r = n.charCodeAt(h)) >= 65536 && r <= 1114111 ? (e.push(r >> 18 & 7 | 240),
        e.push(r >> 12 & 63 | 128), e.push(r >> 6 & 63 | 128), e.push(63 & r | 128)) : r >= 2048 && r <= 65535 ? (e.push(r >> 12 & 15 | 224),
        e.push(r >> 6 & 63 | 128), e.push(63 & r | 128)) : r >= 128 && r <= 2047 ? (e.push(r >> 6 & 31 | 192),
        e.push(63 & r | 128)) : e.push(255 & r);
    return e;
};

function getTime(){
    var l = new Date();
    var u = l.getFullYear() + ("0" + (l.getMonth() + 1)).slice(-2) + ("0" + l.getDate()).slice(-2) + ("0" + l.getHours()).slice(-2) + ("0" + l.getMinutes()).slice(-2) + ("0" + l.getSeconds()).slice(-2);
    console.log(u)
    return u;
}

function stringToByte(n) {
  var t, r, e = new Array();
  t = n.length;
  for (var h = 0; h < t; h++) (r = n.charCodeAt(h)) >= 65536 && r <= 1114111 ? (e.push(r >> 18 & 7 | 240),
      e.push(r >> 12 & 63 | 128), e.push(r >> 6 & 63 | 128), e.push(63 & r | 128)) : r >= 2048 && r <= 65535 ? (e.push(r >> 12 & 15 | 224),
      e.push(r >> 6 & 63 | 128), e.push(63 & r | 128)) : r >= 128 && r <= 2047 ? (e.push(r >> 6 & 31 | 192),
      e.push(63 & r | 128)) : e.push(255 & r);
  return e;
};

function encryptData_CBC(t) {
  var r = stringToByte(t), e = stringToByte("D6B25F5A7FAD4CE59D00E52C30D39755"),
      h = stringToByte("EDNEXSNE89EKL21B"),
      l = function (n) {
          for (var t = "", r = 0; r < n.length; r += 3) for (var e = (255 & n[r]) << 16 | (255 & n[r + 1]) << 8 | 255 & n[r + 2], h = 0; h < 4; h++) r + .75 * h >= n.length ? t += "=" : t += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(e >>> 6 * (3 - h) & 63);
          return t;
      }(new n().encrypt_cbc(e, h, r));
  return null != l && l.trim().length > 0 && l.replace(/(\s*|\t|\r|\n)/g, ""), l;
}

function getTime() {
  var l = new Date();
  var u = l.getFullYear() + ("0" + (l.getMonth() + 1)).slice(-2) + ("0" + l.getDate()).slice(-2) + ("0" + l.getHours()).slice(-2) + ("0" + l.getMinutes()).slice(-2) + ("0" + l.getSeconds()).slice(-2);
  return u;
}

// 暴露给其他文件使用
export { encryptData_CBC, getTime };