export async function poll(strategy, tries = 10, delay = 500) {
    let lastErr;
    while (tries-- > 0) {
        try {
            lastErr = null;
            const result = await strategy();
            if (result)
                return result;
        } catch (err) {
            lastErr = err;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    if (lastErr)
        throw lastErr;
    return false;
}
