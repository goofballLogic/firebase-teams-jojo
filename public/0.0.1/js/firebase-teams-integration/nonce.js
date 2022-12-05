export function nonce() {
    return Date.now().toString() + Math.random().toString().substring(1).replace(".", "-");
}
