import Redis from "ioredis";

const rediss = new Redis({
  host: "redis",
  port: 6379,
});


// ----------------- Basic Key Operations -----------------
export function del(key: string, path: string = "$") 
{
  return rediss.call("JSON.DEL", key, path);
}

export async function exists(key: string) 
{
  const res = await rediss.exists(key);
  return res > 0;
}

export function expire(key: string, ttlSeconds: number) 
{
  return rediss.expire(key, ttlSeconds);
}

// ----------------- Set / Get (Smart) -----------------
export async function set(key: string, value: any, ttlSeconds?: number) 
{
  if (value === null || value === undefined) return;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") 
  {
    if (ttlSeconds) await rediss.set(key, String(value), "EX", ttlSeconds);
    else await rediss.set(key, String(value));
  } 
  else if (typeof value === "object") 
  {
    await rediss.call("JSON.SET", key, "$", JSON.stringify(value));
    if (ttlSeconds) await rediss.expire(key, ttlSeconds);
  } 
  else 
    {
    throw new Error("Unsupported type for Redis storage");
  }
}



export async function get(key: string) 
{
  const data = await rediss.call("JSON.GET", key, "$");
  if (data) 
  {
    // Ensure we operate on a string (avoid casting Promise/unknown -> string)
    const parsed = JSON.parse(String(data));
    return parsed && parsed.length > 0 ? parsed[0] : null;
  }

  const plain = await rediss.get(key);
  return plain !== null ? plain : null;
}

// ----------------- JSON Update / Merge -----------------
export function update(key: string, path: string, value: any) 
{
  return rediss.call(
    "JSON.SET",
    key,
    path.startsWith("$") ? path : `$.${path}`,
    JSON.stringify(value)
  );
}

export async function mergeObject(key: string, path: string, newData: Record<string, any>) 
{
  const current = await rediss.call(
    "JSON.GET",
    key,
    path.startsWith("$") ? path : `$.${path}`
  );
  // JSON.GET can return unknown; coerce to string before parsing
  const currentObj = current ? JSON.parse(String(current))[0] : {};
  const merged = { ...currentObj, ...newData };
  return rediss.call(
    "JSON.SET",
    key,
    path.startsWith("$") ? path : `$.${path}`,
    JSON.stringify(merged)
  );
}


// ----------------- Array Helpers -----------------
export function appendToArray(key: string, path: string, values: any | any[]) 
{
  const arr = Array.isArray(values) ? values : [values];
  return rediss.call(
    "JSON.ARRAPPEND",
    key,
    path.startsWith("$") ? path : `$.${path}`,
    ...arr.map(v => JSON.stringify(v))
  );
}

export function removeFromArray(key: string, path: string, index: number) 
{
  return rediss.call(
    "JSON.ARRPOP",
    key,
    path.startsWith("$") ? path : `$.${path}`,
    index
  );
}

export async function arrayUniqueMerge(key: string, path: string, values: any | any[]) 
{
  const arr = Array.isArray(values) ? values : [values];
  const current = await rediss.call(
    "JSON.GET",
    key,
    path.startsWith("$") ? path : `$.${path}`
  );
  // JSON.GET can return unknown; coerce to string before parsing
  const currentArr = current ? JSON.parse(String(current))[0] : [];
  const merged = Array.from(new Set([...currentArr, ...arr]));
  return rediss.call(
    "JSON.SET",
    key,
    path.startsWith("$") ? path : `$.${path}`,
    JSON.stringify(merged)
  );
}

// ----------------- Counters -----------------
export function incr(key: string, amount = 1) 
{
  return rediss.incrby(key, amount);
}

export function decr(key: string, amount = 1) 
{
  return rediss.decrby(key, amount);
}


// ----------------- Online Users Management -----------------
export async function getOnlineUsers() 
{
  const onlineUsers = await rediss.smembers('online_users');
  return onlineUsers || [];
}

// ----------------- Export Single Object -----------------
export const redis = {
  get,
  exists,
};
