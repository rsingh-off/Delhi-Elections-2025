(function() {
    const customDynamicStyle = document.createElement("style");
    document.head.appendChild(customDynamicStyle);

    const TOGGLE_BUTTON_REFERENCE_ELEMENT_NOT_FOUND_WARNING = "[mkdocs-toggle-sidebar-plugin] Reference element for inserting 'toggle_button' not found. This version of the plugin may not be compatible with this version of the theme. Try updating both to the latest version. If that fails, you can open an GitHub issue.";

    const loadBool = (name, default_value) => {
        const value = localStorage.getItem(`TOGGLE_SIDEBAR_${name}`);
        if (value == null) {
            return default_value;
        } else {
            return value == "1";
        }
    }

    const loadNavigationState = () => loadBool("NAVIGATION", true);
    const loadTocState = () => loadBool("TOC", true);

    const saveBool = (name, value) => {
        localStorage.setItem(`TOGGLE_SIDEBAR_${name}`, value ? "1" : "0");
    }

    const toggleVisibility = (toggleNavigation, toggleTOC) => {
        let newNavigation = loadNavigationState();
        let newTOC = loadTocState();
        
        if (toggleNavigation) {
            newNavigation = !newNavigation;
            saveBool("NAVIGATION", newNavigation);
        }
        if (toggleTOC) {
            newTOC = !newTOC;
            saveBool("TOC", newTOC);
        }
        
        _setVisibility(newNavigation, newTOC);
    }

    const _setVisibility = (newNavigation, newTOC) => {
        console.debug(`Setting new visibility: navigation=${newNavigation}, TOC=${newTOC}`);
        // combine this into one operation, so that it is more efficient (for toggling both) and easier to code with dynamic CSS generation
        customDynamicStyle.innerHTML = setCombinedVisibility(newNavigation, newTOC);
    }

    // START OF INCLUDE
    // This gets replaced with the definitions of: 
    // - setCombinedVisibility(showNavigation: bool, showTOC: bool) -> string (dynamic CSS)
    // - registerKeyboardEventHandler() -> void
    const setCombinedVisibility = (showNavigation, showTOC) => {
    // Navigation and TOC are merged so we just pick one of the values and trust them
    // @TODO: add support for combined bars in toggle-sidebar.js?
    let style = `
.mkdocs-toggle-sidebar-button {
    cursor: pointer;
    width: 1em;
    fill: darkgray;
    display: flex;
    margin-right: 5px;
}

/* Hide toggle button in mobile view */
@media screen and (max-width: 768px) {
    .wy-breadcrumbs > li.mkdocs-toggle-sidebar-container {
        display: none;
    }
}
`;
    if (!showNavigation) {
        // We can not hide the contents in mobile view, since then the hamburger menu would be empty
        style += `
@media screen and (min-width: 768px) {
    section.wy-nav-content-wrap {
        margin-left: 0px;
    }

    nav.wy-nav-side, div.rst-versions {
        display: none;
    }

    div.wy-nav-content {
        max-width: 1100px;
    }
}
`;
    }

    return style;
    
}

const addToggleButton = (toggleNavigation, toggleTOC) => {
    const toggleBtn = createDefaultToggleButton(toggleNavigation, toggleTOC);
    toggleBtn.title = "Toggle Navigation"; // There is only one real sidebar, so we use this name for consistency
    const li = document.createElement("li");
    li.className = "mkdocs-toggle-sidebar-container";
    li.append(toggleBtn);

    const titleElement = document.querySelector("ul.wy-breadcrumbs");
    if (titleElement) {
        titleElement.insertBefore(li, titleElement.firstChild);  
    } else {
        console.warn(TOGGLE_BUTTON_REFERENCE_ELEMENT_NOT_FOUND_WARNING);
    }
}

const registerKeyboardEventHandler = () => {
    // Native HTML key event handling
    document.addEventListener("keydown", (event => {
        if (coreEventListenerLogic(event.key)) {
            // event handled, stop propagation
            event.preventDefault();
            event.stopPropagation();
        }
    }));
}

    // END OF INCLUDE

    // argument: string, returns true if the key was handled and the event should be marked as already handled
    const coreEventListenerLogic = (keyChar) => {
        if (keyChar === "t") {
            toggleVisibility(false, true);
            return true;
        } else if (keyChar === "m") {
            toggleVisibility(true, false);
            return true;
        } else if (keyChar === "b") {
            toggleVisibility(true, true);
            return true;
        } else {
            return false;
        }
    }

    window.addEventListener("load", () => {
        console.log("The mkdocs-toggle-sidebar-plugin is installed. It adds the following key bindings:\n T -> toggle table of contents sidebar\n M -> toggle navigation menu sidebar\n B -> toggle both sidebars (TOC and navigation)");

        const toggle_button = "all";
        if (toggle_button == "none") {
            // do nothing
        } else if (toggle_button == "navigation") {
            addToggleButton(true, false);
        } else if (toggle_button == "toc") {
            addToggleButton(false, true);
        } else if (toggle_button == "all") {
            addToggleButton(true, true);
        } else {
            console.error(`[mkdocs-toggle-sidebar-plugin] Unknown value for toggle_button: '${toggleButtonType}'`);
        }

        registerKeyboardEventHandler();
        customDynamicStyle.innerHTML = setCombinedVisibility(loadNavigationState(), loadTocState());
    });

    const createDefaultToggleButton = (toggleNavigation, toggleTOC) => {
        const toggleBtn = document.createElement("div");
        toggleBtn.className = "mkdocs-toggle-sidebar-button";
        toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z"></path></svg>`;
        if (toggleNavigation && toggleTOC) {
            toggleBtn.title = "Toggle Navigation and Table of Contents";
        } else if (toggleNavigation) {
            toggleBtn.title = "Toggle Navigation";
        } else if (toggleTOC) {
            toggleBtn.title = "Toggle Table of Contents";
        }
        toggleBtn.addEventListener("click", () => toggleVisibility(toggleNavigation, toggleTOC));
        return toggleBtn;
    };

    // Export functions that the user can call to modify the state
    window.MkdocsToggleSidebarPlugin = {
        setNavigationVisibility: (show) => {
            saveBool("NAVIGATION", show);
            _setVisibility(show, loadTocState());
        },
        setTocVisibility: (show) => {
            saveBool("TOC", show);
            _setVisibility(loadNavigationState(), show);
        },
        setAllVisibility: (showNavigation, showTOC) => {
            saveBool("NAVIGATION", showNavigation);
            saveBool("TOC", showTOC);
            _setVisibility(showNavigation, showTOC);
        },
        toggleNavigationVisibility: () => toggleVisibility(true, false),
        toggleTocVisibility: () => toggleVisibility(false, true),
        toggleAllVisibility: () => toggleVisibility(true, true)
    };
}());
