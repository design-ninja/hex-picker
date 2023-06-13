window.addEventListener('DOMContentLoaded', () => {
    const mainCont = document.getElementById("mainCont");
    const buttonCont = document.getElementById("picker_btn_cont");
    const resultList = document.getElementById("result");
    let ClearButton = null;

    const GiveMetheChild = (color, msg) => {
        const errorLabel = document.createElement("div");
        errorLabel.setAttribute("class", "errorLabel");
        errorLabel.style.backgroundColor = color;
        errorLabel.innerText = msg;

        mainCont.appendChild(errorLabel);
        setTimeout(() => {
            mainCont.removeChild(errorLabel);
        }, 2000);
    }

    function hexToRgb(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    function isLightColor(color) {
        const rgb = hexToRgb(color);
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        return brightness > 128;
    };

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];

        if (tab.url === undefined || tab.url.indexOf('chrome') === 0) {
            buttonCont.innerHTML = '<i>ColorPicker can\'t access Chrome pages</i>';
        }
        else if (tab.url.indexOf('file') === 0) {
            buttonCont.innerHTML = '<i>ColorPicker can\'t access local pages</i>';
        } else {
            const button = document.createElement("button");
            button.setAttribute("id", "picker_btn");
            button.innerText = "Pick a color";

            button.addEventListener("click", () => {
                if (!window.EyeDropper) {
                    GiveMetheChild("#FEF2CE", 'Your browser does not support the ColorPicker API');
                    return;
                }

                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { from: "popup", query: "eye_dropper_clicked" }
                );
                window.close();
            });

            buttonCont.appendChild(button);
        }
    });

    function refreshPopup() {
        chrome.storage.local.get("color_hex_code", (resp) => {
            resultList.innerHTML = '';  
            if (resp.color_hex_code && resp.color_hex_code.length > 0) {
                resp.color_hex_code.reverse().forEach(hexCode => {
                    const liElem = document.createElement("span");
                    liElem.innerText = hexCode;
                    liElem.style.backgroundColor = hexCode;
                    if (isLightColor(hexCode)) {
                        liElem.style.color = 'rgba(0, 0, 0, 0.6)';
                    } else {
                        liElem.style.color = 'rgba(255, 255, 255, 0.7)';
                    }
                    liElem.addEventListener("click", () => {
                        navigator.clipboard.writeText(hexCode);
                        GiveMetheChild("#FEF2CE", "Hex code is copied to clipboard!");
                    })
                    resultList.prepend(liElem);
                });
                // Show the result block when there are colors
                resultList.style.display = "flex";
                if (!ClearButton) {
                    ClearButton = document.createElement("button");
                    ClearButton.innerText = "Clear colors";
                    ClearButton.setAttribute("id", "ClearButton");
                    ClearButton.addEventListener("click", () => {
                        chrome.storage.local.remove("color_hex_code", refreshPopup);
                        // Send a message to clear the badge
                        chrome.runtime.sendMessage({query: "clear_badge"});
                    });
                    mainCont.appendChild(ClearButton);
                }
            } else {
                // Hide the result block when there are no colors
                resultList.style.display = "none";
                if (ClearButton) {
                    mainCont.removeChild(ClearButton);
                    ClearButton = null;
                }
            }
        });
    }

    chrome.storage.local.get("color_hex_code", (resp) => {
        if (resp.color_hex_code && resp.color_hex_code.length > 0) {
            resp.color_hex_code.reverse().forEach(hexCode => {
                const liElem = document.createElement("span");
                liElem.innerText = hexCode;
                liElem.style.backgroundColor = hexCode;
                if (isLightColor(hexCode)) {
                    liElem.style.color = 'rgba(0, 0, 0, 0.6)';
                } else {
                    liElem.style.color = 'rgba(255, 255, 255, 0.7)';
                }
                liElem.addEventListener("click", () => {
                    navigator.clipboard.writeText(hexCode);
                    GiveMetheChild("#FEF2CE", "Hex code is copied to clipboard!");
                })
                resultList.prepend(liElem);
            });

            ClearButton = document.createElement("button");
            ClearButton.innerText = "Clear colors";
            ClearButton.setAttribute("id", "ClearButton");
            ClearButton.addEventListener("click", () => {
                chrome.storage.local.remove("color_hex_code", refreshPopup);
                // Send a message to clear the badge
                chrome.runtime.sendMessage({query: "clear_badge"});
            });
            mainCont.appendChild(ClearButton);
        }
    });

    refreshPopup();
});
