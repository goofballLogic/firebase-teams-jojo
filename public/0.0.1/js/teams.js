export function teams({ container, state }) {
    if (state.user) {
        container.textContent = "hello";
    } else {
        container.textContent = "";
    }
}
