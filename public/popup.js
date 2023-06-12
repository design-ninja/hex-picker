window.addEventListener('DOMContentLoaded', () => {
    const mainCont = document.getElementById("mainCont");
    const buttonCont = document.getElementById("picker_btn_cont");
    const resultList = document.getElementById("result");

    const GiveMetheChild = (color, msg) => {
        const errorLabel = document.createElement("p")
        errorLabel.setAttribute("class", "errorLabel")
        errorLabel.style.backgroundColor = color
        errorLabel.innerText = msg

        mainCont.appendChild(errorLabel)
        setTimeout(() => {
            mainCont.removeChild(errorLabel)
        }, 2000)
    }

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0]

        if (tab.url === undefined || tab.url.indexOf('chrome') == 0) {
            buttonCont.innerHTML = 'ColorPicker can\'t access <i>Chrome pages</i>'
        }
        else if (tab.url.indexOf('file') === 0) {
            buttonCont.innerHTML = 'ColorPicker can\'t access <i>local pages</i>'
        } else {
            const button = document.createElement("button")
            button.setAttribute("id", "picker_btn")
            button.innerText = "Pick a color"

            button.addEventListener("click", () => {
                if (!window.EyeDropper) {
                    GiveMetheChild("#ad5049", 'Your browser does not support the ColorPicker API')
                    return
                }

                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { from: "popup", query: "eye_dropper_clicked" }
                );
                window.close()
            })

            buttonCont.appendChild(button)
        }
    });

    chrome.storage.local.get("color_hex_code", (resp) => {
        if (resp.color_hex_code && resp.color_hex_code.length > 0) {
            // Note the reversal here
            resp.color_hex_code.reverse().forEach(hexCode => {
                const liElem = document.createElement("span")
                liElem.innerText = hexCode
                liElem.style.backgroundColor = hexCode
                liElem.addEventListener("click", () => {
                    navigator.clipboard.writeText(hexCode);
                    GiveMetheChild("#FEF8E6", "Hex code is copied to clipboard!")
                })
                resultList.prepend(liElem)
            })
    
            const ClearButton = document.createElement("button")
            ClearButton.innerText = "Clear colors"
            ClearButton.setAttribute("id", "ClearButton")
            ClearButton.addEventListener("click", () => {
                chrome.storage.local.remove("color_hex_code")
                window.close()
            })
            mainCont.appendChild(ClearButton)
        }
    })
})
