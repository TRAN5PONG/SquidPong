

export async function sendToService( url: string, method: string , id:any = null , body: any = null): Promise<object> 
{

  let type = 'application/json';
  const options:any = {
    method: method,
    headers: { 'X-Secret-Token': process.env.SECRET_TOKEN || '' },
  };

  if (body != null && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()))
  {
    options.headers['Content-Type'] = type;
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  return (await res.json());
}


