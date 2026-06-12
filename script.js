const SCALE = [
    -10000,
    -6775,
    -4191,
    -2594,
    -1607,
    -1000,
    -620,
    -387,
    -243,
    -154,
    -100,
    -65,
    -44,
    -31,
    -23,
    -18,
    -15,
    -13,
    -12,
    -11,
    -10,
    -9,
    -8,
    -7,
    -6,
    -5,
    -4,
    -3,
    -2,
    -1,

     0,

     1,
     2,
     3,
     4,
     5,
     6,
     7,
     8,
     9,
     10,
     11,
     12,
     13,
     15,
     18,
     23,
     31,
     44,
     65,
     100,
     154,
     243,
     387,
     620,
     1000,
     1607,
     2594,
     4191,
     6775,
     10000,
];

let setups = {};
let preferencesConfig = null;
let currentResults = [];

async function loadData() {

    const setupResponse =
        await fetch(
            "setups.json"
        );

    setups =
        await setupResponse.json();

    const prefResponse =
        await fetch(
            "preferences.json"
        );

    preferencesConfig =
        await prefResponse.json();

    buildPreferences();

}

loadData();

function togglePreferences() {

    document
        .getElementById(
            "preferencesPanel"
        )
        .classList
        .toggle("hidden");

}

function nearestScaleIndex(value) {

    let bestIndex = 0;
    let bestDistance = Infinity;

    SCALE.forEach(
        (scaleValue, index) => {

            const distance =
                Math.abs(
                    scaleValue
                    - value
                );

            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;

                bestIndex =
                    index;

            }

        }
    );

    return bestIndex;

}

function buildPreferences() {

    const container =
        document.getElementById(
            "preferences"
        );

    container.innerHTML = "";

    preferencesConfig.groups
        .forEach(group => {

        const groupDiv =
            document.createElement(
                "div"
            );

        groupDiv.className =
            "preference-group";

        groupDiv.innerHTML =
            `<h3>${group.name}</h3>`;

        group.preferences
            .forEach(pref => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "slider-row";

            row.innerHTML = `

                <label>

                    ${pref.label}
                    
                    <span class="tooltip-container">

                        ⓘ

                        <span class="tooltip">
                            ${pref.description || ""}
                        </span>

                    </span>

                </label>

                <input
                    type="range"
                    min="0"
                    max="${SCALE.length - 1}"
                    value="${nearestScaleIndex(pref.defaultWeight ?? 0)}"
                    id="${pref.id}Slider">

                <input
                    type="number"
                    value="${pref.defaultWeight ?? 0}"
                    id="${pref.id}Number">

            `;

            groupDiv.appendChild(
                row
            );

        });

        container.appendChild(
            groupDiv
        );

    });

    initializePreferenceLogic();

}

function initializePreferenceLogic() {

    preferencesConfig.groups
        .forEach(group => {

        group.preferences
            .forEach(pref => {

            const slider =
                document.getElementById(
                    `${pref.id}Slider`
                );

            const number =
                document.getElementById(
                    `${pref.id}Number`
                );

            const defaultValue =
                pref.defaultWeight ?? 0;

            const saved =
                localStorage.getItem(
                    pref.id
                );

            if (
                saved !== null
            ) {

                number.value =
                    saved;

                slider.value =
                    nearestScaleIndex(
                        Number(saved)
                    );

            }
            else {

                number.value =
                    defaultValue;

                slider.value =
                    nearestScaleIndex(
                        defaultValue
                    );

            }

            slider.addEventListener(
                "input",
                () => {

                const value =
                    SCALE[
                        Number(
                            slider.value
                        )
                    ];

                number.value =
                    value;

                localStorage.setItem(
                    pref.id,
                    value
                );

                rerankResults();

            });

            number.addEventListener(
                "input",
                () => {

                const value =
                    Number(
                        number.value
                    );

                slider.value =
                    nearestScaleIndex(
                        value
                    );

                localStorage.setItem(
                    pref.id,
                    value
                );

                rerankResults();

            });

        });

    });

}

function resetPreferences() {

    preferencesConfig.groups
        .forEach(group => {

        group.preferences
            .forEach(pref => {

            const value =
                pref.defaultWeight ?? 0;

            localStorage.removeItem(
                pref.id
            );

            document.getElementById(
                `${pref.id}Number`
            ).value =
                value;

            document.getElementById(
                `${pref.id}Slider`
            ).value =
                nearestScaleIndex(
                    value
                );

        });

    });

    rerankResults();

}

function getWeights() {

    const weights = {};

    preferencesConfig.groups
        .forEach(group => {

        group.preferences
            .forEach(pref => {

            weights[pref.id] =
                Number(
                    document
                    .getElementById(
                        `${pref.id}Number`
                    )
                    .value
                );

        });

    });

    return weights;

}

function scoreSetup(setup) {

    const weights =
        getWeights();

    let score = 0;

    Object.keys(weights)
        .forEach(key => {

        score +=

            (setup[key] || 0)

            *

            weights[key];

    });

    return score;

}

function findSetups() {

    const target =
        document
        .getElementById(
            "targetInput"
        )
        .value;

    currentResults =
        [...(
            setups[target]
            || []
        )];

    rerankResults();

}

function rerankResults() {

    currentResults.sort(
        (a, b) =>
            scoreSetup(b)
            -
            scoreSetup(a)
    );

    displayResults();

}

function displayResults() {

    const container =
        document.getElementById(
            "results"
        );

    container.innerHTML = "";

    if (
        currentResults.length === 0
    ) {

        container.innerHTML =
            "<p>No setups found.</p>";

        return;

    }
    
    currentResults.forEach(
        setup => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "setup";

            const techniqueTags =
                buildTechniqueTags(
                    setup
                );

            const speedSection =
                buildRocketSpeedSection(
                    setup
                );

            const allCode =
                setup.binds
                    .map(
                        bind =>
                            bind.code
                    )
                    .join(
                        "\n"
                    );

            const bindsSection =
                buildBindsSection(
                    setup
                );

            const codeBlock =
                setup.binds
                    .map(
                        bind => `${bind.code}`
                    )
                    .join(
                        "\n"
                    );

            div.innerHTML = `
                
                <!--
                <h2>
                    Score:
                    ${scoreSetup(setup)}
                </h2>
                -->

                <div class="tag-row">

                    ${techniqueTags}

                </div> 

                ${bindsSection}

                <details>

                    <summary>
                        Show binds
                    </summary>

                    <pre class="alias-code">${allCode}</pre>

                </details>

                <button
                    class="copy-button">

                    Copy binds

                </button>

                <h4>
                    Initial speed and speed after rocket hits
                </h4>

                <div>

                    ${speedSection}

                </div>

            `;


            div
            .querySelector(
                ".copy-button"
            )
            .addEventListener(
                "click",
                () => {

                    copyText(
                        allCode
                    );

                }
            );


            container.appendChild(
                div
            );

        }
    );

}

function launcherDescription(type) {

    const map = {

        stock:
            "Uses the stock rocket launcher.",

        original:
            "Uses the Original.",

        mangler:
            "Uses the Cow Mangler."

    };

    return map[type];
}

function launcherClass(
    launcher
) {

    switch (launcher) {

        case "stock":
            return "launcher-stock";

        case "original":
            return "launcher-original";

        case "mangler":
            return "launcher-mangler";

        default:
            return "";

    }

}

function launcherTagType(
    launcher
) {

    switch (launcher) {

        case "stock":
            return "launcher-stock";

        case "original":
            return "launcher-original";

        case "mangler":
            return "launcher-mangler";

        default:
            return "";
    }

}

function buildLauncherTag(
    launcher
) {

    return createTag(

        capitalizeFirstLetter(launcher),

        {
            description:
                launcherDescription(
                    launcher
                ),

            type:
                launcherTagType(
                    launcher
                )
        }

    );

}

function buildTechniqueTags(setup) {

    const tags = [];

    const techniques =
        setup.techniques;

    const launcherTag =
    buildLauncherTag(
        setup.launcher
    );
    tags.push(launcherTag);

    const rocketTag =
        createTag(
            `${setup.rocketCount} rocket${setup.rocketCount > 1 ? "s" : ""}`,
            {
                description:
                    "Number of rockets used.",

                type:
                    "rocket-tag"
            }
        );
    tags.push(rocketTag);
    
    if (
        techniques.bounce?.possible
    ) {

        tags.push(
            createTag(
                techniques.bounce.automatic
                    ? "Bounce (Auto)"
                    : "Bounce",

                
                {
                    description:
                        "Crouched bounce is possible.",

                    type:
                        techniques.bounce.automatic
                            ? "technique-auto"
                            : "technique-tag"
                }

            )
        );

    }

    if (
        techniques.standingBounce?.possible
    ) {

        tags.push(
            createTag(
                techniques
                .standingBounce
                .automatic

                    ? "Standing Bounce (Auto)"
                    : "Standing Bounce",

                {
                    description:
                        "Standing bounce is possible.",

                    type:
                        techniques
                        .standingBounce
                        .automatic

                            ? "technique-auto"
                            : "technique-tag",
                }

            )
        );

    }

    if (
        techniques.jumpbug?.possible
    ) {

        tags.push(
            createTag(
                "Jumpbug",
                {
                    description:
                        "Jumpbug is possible.",

                    type:
                        "technique-tag"
                }
            )
        );

    }

    if (
        techniques.syncedBounce?.possible
    ) {

        tags.push(
            createTag(
                techniques
                .syncedBounce
                .automatic

                    ? "Synced Bounce (Auto)"
                    : "Synced Bounce",

                {
                    description:
                        "Bounce can be synched.",

                    type:
                        techniques
                        .syncedBounce
                        .automatic

                            ? "technique-auto"
                            : "technique-tag"
                }
            )
        );

    }

    return tags.join("");

}

function createTag(
    text,
    options = {}
) {

    return `
        <span
            class="tag ${options.type || ""} tooltip-container">

            ${text}

            <span class="tooltip">

                ${options.description || ""}

            </span>

        </span>
    `;
}

function buildRocketSpeedSection(
    setup
) {

    return setup.rocketSpeeds
        .map(
            (speed, index) =>
            
            index == 0 ?
            `<span
                class="speed-badge">

                Initial:
                ${speed}
                u/s

            </span>` 
            :
            `<span
                class="speed-badge">

                R<sub>${index + 1}</sub>:
                ${speed}
                u/s

            </span>` 
        )
        .join("");

}

function copyText(text) {

    navigator.clipboard
        .writeText(text);

}

function capitalizeFirstLetter(str) {
    if (!str) return str; // Handles empty strings safely
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildBindsSection(
    setup
) {

    return setup.binds
        .map(
            bind =>

            `

            <div
                class="bind-card">
                
                <span
                    class="tooltip-container">

                    ⓘ

                    <span
                        class="tooltip">

                        ${bind.description}

                    </span>

                </span>

                <strong>

                    ${bind.name}

                </strong>


            </div>

            `
        )
        .join("");

}
