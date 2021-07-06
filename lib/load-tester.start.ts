const handler = async (event: any) => {

  console.log(event);
  
  let count: number = event.count ?? 5;
  let response = { "Items": Array.from(Array(count), (d, i) => ({ request: i}) ) };

  console.log(response);

  return response;

}

export { handler }