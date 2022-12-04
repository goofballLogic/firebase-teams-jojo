export const fetchingOp =
    async (promise, title = "Please wait", message = "Fetching data from the server") =>
        op(promise, title, message);

export const commandOp =
    async (promise, title = "Please wait", message = "Communicating with the server") =>
        op(promise, title, message);

async function op(promise, title, message) {

    const modal = document.createElement("DIALOG");
    modal.innerHTML = `<heading>${title}</heading><section>${message}</section>`;
    document.body.appendChild(modal);
    let timeout = setTimeout(() => modal.showModal(), 200);
    try {
        return await promise;
    } finally {
        modal.remove();
        clearTimeout(timeout);
    }

}

export async function poll(strategy, tries = 20, delay = 500) {

    while (tries-- > 0) {

        const result = await strategy();
        if (result) return result;
        await new Promise(resolve => setTimeout(resolve, delay));

    }

}
