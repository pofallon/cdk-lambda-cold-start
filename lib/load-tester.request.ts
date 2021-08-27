import got from 'got';

const routes = process.env.routes?.split(',');

const handler = async (event: any) => {

  console.log(event);
  console.log(routes);
  
  const promises = routes?.map(r => got(r, { prefixUrl: process.env.prefix }) );
  // @ts-ignore
  await Promise.all(promises);

}

export { handler }