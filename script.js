let setups = {};

let currentResults = [];

async function loadData() {

    const response =
        await fetch("setups.json");

    setups =
        await response.json();

    console.log("Loaded setups");

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
                    "difficultyWeight"
                ).value
            ),

        speed:
            Number(
                document.getElementById(
                    "speedWeight"
                ).value
            ),

        consistency:
            Number(
                document.getElementById(
                    "consistencyWeight"
                ).value
            )

    };

}

function scoreSetup(setup) {

    const w =
        getWeights();

    return (

        setup.difficulty *
        w.difficulty

        +

        setup.speed *
        w.speed

        +

        setup.consistency *
        w.consistency

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
                <h3>
                    Score:
                    ${scoreSetup(setup)}
                </h3>

                <p>
                    ${setup.description}
                </p>

                <ul>
                    <li>
                        Difficulty:
                        ${setup.difficulty}
                    </li>

                    <li>
                        Speed:
                        ${setup.speed}
                    </li>

                    <li>
                        Consistency:
                        ${setup.consistency}
                    </li>
                </ul>
            `;

            container.appendChild(
                div
            );

        });

}

/*
    Slider + Number Synchronization
*/

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
            setting.slider
        );

    if (saved !== null) {

        slider.value =
            saved;

        number.value =
            saved;

    }

    slider.addEventListener(
        "input",
        () => {

            number.value =
                slider.value;

            localStorage.setItem(
                setting.slider,
                slider.value
            );

            rerankResults();

        }
    );

    number.addEventListener(
        "input",
        () => {

            slider.value =
                number.value;

            localStorage.setItem(
                setting.slider,
                number.value
            );

            rerankResults();

        }
    );

});
