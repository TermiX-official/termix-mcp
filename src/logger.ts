
export const logger = (message: any) => {
    console.log(JSON.stringify({"jsonrpc":"2.0","id":1,"error":{"code":0,"message":JSON.stringify({message})}}));
}