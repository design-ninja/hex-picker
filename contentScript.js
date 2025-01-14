const GiveMetheChild = (color, msg, mainCont) => {
    const errorLabel = document.createElement("div");
    errorLabel.setAttribute("class", "errorLabel");
    errorLabel.style.backgroundColor = color;
    errorLabel.innerText = msg;
    mainCont.appendChild(errorLabel);
    setTimeout(() => mainCont.removeChild(errorLabel), 2000);
};

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    const [, r, g, b] = result;
    return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16) };
};

const isLightColor = (color) => {
    const { r, g, b } = hexToRgb(color) || {};
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
};

const createPickColorButton = (tab, mainCont) => {
    const button = document.createElement("button");
    button.setAttribute("id", "picker_btn");
    button.innerText = "Pick a color";

    button.addEventListener("click", () => {
        if (!window.EyeDropper) {
            GiveMetheChild("#FEF2CE", 'Your browser does not support the ColorPicker API', mainCont);
            return;
        }
        chrome.tabs.sendMessage(
            tab.id,
            { from: "popup", query: "eye_dropper_clicked" }
        );
        window.close();
    });

    return button;
};

const storeColor = (color) => {
    chrome.storage.local.get("color_hex_code", (resp) => {
        if (resp.color_hex_code && resp.color_hex_code.length > 0) {
            resp.color_hex_code.unshift(color);
        } else {
            resp.color_hex_code = [color];
        }
        chrome.storage.local.set({ "color_hex_code": resp.color_hex_code }, () => {
            refreshPopup();
        });
        chrome.runtime.sendMessage({ color: color });
    });
}

// Event handlers

chrome.runtime.onMessage.addListener((message) => {
    if (message.from === "popup" && message.query === "eye_dropper_clicked") {

        setTimeout(() => {

            const eyeDropper = new EyeDropper();

            eyeDropper.open().then(result => {
                const color = result.sRGBHex;
                navigator.clipboard.writeText(color).then(() => {
                    console.log('Color copied to clipboard successfully!');
                }, (err) => {
                    console.error('Could not copy color: ', err);
                });

                storeColor(color);

            }).catch(e => {
                console.log(e);
            });
        }, 500);
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const mainCont = document.getElementById("mainCont");
    const buttonCont = document.getElementById("picker_btn_cont");
    const resultList = document.getElementById("result");

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];

        if (tab.url === undefined || tab.url.indexOf('chrome') == 0) {
            buttonCont.innerHTML = '<i>ColorPicker can\'t access Chrome pages</i>';
        }
        else if (tab.url.indexOf('file') === 0) {
            buttonCont.innerHTML = '<i>ColorPicker can\'t access local pages</i>';
        }
        else {
            const button = createPickColorButton(tab, mainCont);
            buttonCont.appendChild(button);
        }
    });

    chrome.storage.local.get("color_hex_code", (resp) => {
        if (resp.color_hex_code && resp.color_hex_code.length > 0) {
            resp.color_hex_code.forEach(hexCode => {
                const liElem = document.createElement("span");
                liElem.innerText = hexCode;
                liElem.style.backgroundColor = hexCode;
                if (isLightColor(hexCode)) {
                    liElem.style.color = '#000';
                } else {
                    liElem.style.color = '#fff';
                }
                liElem.addEventListener("click", () => {
                    navigator.clipboard.writeText(hexCode);
                    GiveMetheChild("#FEF2CE", "Hex code is copied to clipboard!");
                });
                resultList.prepend(liElem);
            });

            const ClearButton = document.createElement("button");
            ClearButton.innerText = "Clear colors";
            ClearButton.setAttribute("id", "ClearButton");
            ClearButton.addEventListener("click", () => {
                chrome.storage.local.remove("color_hex_code");
                window.close();
            });
            mainCont.appendChild(ClearButton);
        }
    });
});
