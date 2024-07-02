window.addEventListener('DOMContentLoaded', () => {
    let isExpanded = false;
    const mainCont = document.getElementById("mainCont");
    const buttonCont = document.getElementById("picker_btn_cont");
    const resultList = document.getElementById("result");
    let ClearButton = null;

    chrome.storage.local.get("isExpanded", (data) => {
        if (typeof data.isExpanded !== "undefined") {
            isExpanded = data.isExpanded;
            refreshPopup();
        }
    });

    // Menu Setup
    const menu = document.getElementById('menu');
    const menuDropdown = document.createElement('div');
    menuDropdown.id = 'menuDropdown';
    menuDropdown.classList.add('menuDropdown');
    menuDropdown.innerHTML = `
        <div id="clearColors" class="menu-item">Clear colors</div>
        <div id="leaveReview" class="menu-item">Leave your review</div>
        <div id="buyMeACoffee" class="menu-item">Buy me a coffee ☕️</div>
    `;

    document.getElementById('header').appendChild(menuDropdown);

    // Menu Event Listeners
    menu.addEventListener('click', () => { menuDropdown.classList.toggle('show'); });

    document.getElementById('clearColors').addEventListener('click', () => {
        chrome.storage.local.remove("color_hex_code", refreshPopup);
        chrome.runtime.sendMessage({ query: "clear_badge" });
        menuDropdown.classList.remove('show');
    });

    document.getElementById('leaveReview').addEventListener('click', () => {
        window.open('https://chrome.google.com/webstore/detail/hexpicker-%E2%80%94-a-simple-hex/nbfoiiglmnkmdhhaenkekmodabpcfnhc?utm_source=ext_sidebar&hl=en-GB', '_blank');
        menuDropdown.classList.remove('show');
    });

    document.getElementById('buyMeACoffee').addEventListener('click', () => {
        window.open('https://www.buymeacoffee.com/design_ninja', '_blank');
        menuDropdown.classList.remove('show');
    });

    // Close menu when clicked outside
    window.addEventListener('click', (event) => {
        if (!menu.contains(event.target) && !menuDropdown.contains(event.target)) {
            menuDropdown.classList.remove('show');
        }
    });

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

    function createColorElement(hexCode) {
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
        return liElem;
    }

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

    function toggleView() {
        const colorElements = Array.from(document.querySelectorAll('.color-element'));
        if (isExpanded) {
            colorElements.forEach((el, index) => {
                if (index >= 9) el.style.display = 'none';
            });
            document.getElementById("toggleButton").innerText = "Show more";
        } else {
            colorElements.forEach(el => el.style.display = 'inline-block');
            document.getElementById("toggleButton").innerText = "Show less";
        }
        isExpanded = !isExpanded;
        chrome.storage.local.set({ "isExpanded": isExpanded });
    }

    function refreshPopup() {
        chrome.storage.local.get("color_hex_code", (resp) => {
            resultList.innerHTML = '';

            // Remove existing buttons if any
            const toggleButton = document.getElementById("toggleButton");
            if (toggleButton) {
                mainCont.removeChild(toggleButton);
            }
            if (ClearButton) {
                mainCont.removeChild(ClearButton);
                ClearButton = null;
            }

            // Logic to handle 'Show more/Show less' button
            if (resp.color_hex_code && resp.color_hex_code.length > 9) {
                const toggleButton = document.createElement("button");
                toggleButton.innerText = "Show more";
                toggleButton.id = "toggleButton";
                toggleButton.classList.add("toggle-button");
                toggleButton.addEventListener("click", toggleView);
                mainCont.appendChild(toggleButton);
            }

            // Logic to handle 'Clear colors' button and color elements
            if (resp.color_hex_code && resp.color_hex_code.length > 0) {
                resp.color_hex_code.forEach((hexCode, index) => {
                    const liElem = createColorElement(hexCode);
                    liElem.classList.add('color-element');
                    if (index >= 9) liElem.style.display = 'none';
                    resultList.appendChild(liElem);  // Используйте prepend для добавления в начало списка
                });
                resultList.style.display = "flex";
            } else {
                resultList.style.display = "none";
            }

            if (isExpanded) {
                const colorElements = Array.from(document.querySelectorAll('.color-element'));
                colorElements.forEach(el => el.style.display = 'inline-block');
                document.getElementById("toggleButton").innerText = "Show less";
            }
        });
    }

    refreshPopup();
});
