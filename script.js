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

            const launcherTag =
                createTag(
                    setup.launcher.toLowerCase(),
                    launcherDescription(
                        setup.launcher
                    )
                );

            const rocketTag =
                createTag(
                    `${setup.rocketCount} rocket${setup.rocketCount > 1 ? "s" : ""}`,
                    "Number of rockets used."
                );

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

                <h2>
                    Score:
                    ${scoreSetup(setup)}
                </h2>

                <div class="tag-row">

                    ${setup.name}

                    ${launcherTag}

                    ${rocketTag}

                </div>

                <div class="tag-row">

                    ${techniqueTags}

                </div>

                <h4>
                    Speed after rocket hits
                </h4>

                <div>

                    ${speedSection}

                </div>
            

                <h4>
                    Setup
                </h4>

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

function buildTechniqueTags(setup) {

    const tags = [];

    const techniques =
        setup.techniques;

    if (
        techniques.bounce?.possible
    ) {

        tags.push(
            createTag(
                techniques.bounce.automatic
                    ? "Bounce (Auto)"
                    : "Bounce",

                "Crouched bounce is possible."
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

                "Standing bounce is possible."
            )
        );

    }

    if (
        techniques.jumpbug?.possible
    ) {

        tags.push(
            createTag(
                "Jumpbug",

                "Jumpbug is possible."
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

                "Bounce can be synched."
            )
        );

    }

    return tags.join("");

}

function createTag(
    text,
    description
) {

    return `

        <span
            class="tag tooltip-container">

            ${text}

            <span
                class="tooltip">

                ${description}

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

            `<span
                class="speed-badge">

                R${index + 1}:
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

function buildBindsSection(
    setup
) {

    return setup.binds
        .map(
            bind =>

            `

            <div
                class="bind-card">

                <strong>

                    ${bind.name}

                </strong>

                <span
                    class="tooltip-container">

                    ⓘ

                    <span
                        class="tooltip">

                        ${bind.description}

                    </span>

                </span>

            </div>

            `
        )
        .join("");

}
