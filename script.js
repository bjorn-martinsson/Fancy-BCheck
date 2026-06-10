const SCALE = [

    -10000,
    -5000,
    -2000,
    -1000,
    -500,
    -200,
    -100,
    -50,
    -20,
    -10,
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
     10,
     20,
     50,
     100,
     200,
     500,
     1000,
     2000,
     5000,
     10000
];

let setups = {};
let currentResults = [];

async function loadData() {

    const response =
        await fetch("setups.json");

    setups =
        await response.json();

}

loadData();

function togglePreferences() {

    document
        .getElementById("preferences")
        .classList
        .toggle("hidden");

}

function getWeights() {

    return {

        difficulty:
            Number(
                document.getElementById(
                    "difficultyNumber"
                ).value
            ),

        speed:
            Number(
                document.getElementById(
                    "speedNumber"
                ).value
            ),

        consistency:
            Number(
                document.getElementById(
                    "consistencyNumber"
                ).value
            )

    };

}

function scoreSetup(setup) {

    const w = getWeights();

    return (

        setup.difficulty
        * w.difficulty

        +

        setup.speed
        * w.speed

        +

        setup.consistency
        * w.consistency

    );

}

function findSetups() {

    const target =
        document
        .getElementById(
            "targetInput"
        )
        .value;

    currentResults =
        [...(setups[target] || [])];

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

            div.innerHTML = `
                <h3>Score: ${scoreSetup(setup)}</h3>

                <p>${setup.description}</p>

                <ul>
                    <li>Difficulty: ${setup.difficulty}</li>
                    <li>Speed: ${setup.speed}</li>
                    <li>Consistency: ${setup.consistency}</li>
                </ul>
            `;

            container.appendChild(div);

        });

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

const settings = [

    {
        slider: "difficultyWeight",
        number: "difficultyNumber"
    },

    {
        slider: "speedWeight",
        number: "speedNumber"
    },

    {
        slider: "consistencyWeight",
        number: "consistencyNumber"
    }

];

settings.forEach(setting => {

    const slider =
        document.getElementById(
            setting.slider
        );

    const number =
        document.getElementById(
            setting.number
        );

    const saved =
        localStorage.getItem(
            setting.number
        );

    if (saved !== null) {

        number.value = saved;

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
                setting.number,
                value
            );

            rerankResults();

        }
    );

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
                setting.number,
                value
            );

            rerankResults();

        }
    );

});
