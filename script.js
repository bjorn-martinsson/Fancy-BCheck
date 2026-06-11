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
        await fetch("setups.json");

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
                    scaleValue - value
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
                </label>

                <input
                    type="range"
                    min="0"
                    max="${SCALE.length - 1}"
                    value="${(SCALE.length - 1)/2}"
                    id="${pref.id}Slider">

                <input
                    type="number"
                    value="0"
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

    currentResults
        .forEach(setup => {

        const div =
            document.createElement(
                "div"
            );

        div.className =
            "setup";

        div.innerHTML = `

            <h3>
                Score:
                ${scoreSetup(setup)}
            </h3>

            <p>
                ${setup.description}
            </p>

        `;

        container.appendChild(
            div
        );

    });

}
