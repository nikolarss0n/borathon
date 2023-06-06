import * as fs from 'fs';

const testCaseData = [
    {
        id: "LoginAsCustomer",
        steps: [
            { id: "loginAsSalesUser", executionTime: 1, dependencies: [] }
        ]
    },
    {
        id: "LoginAsSalesUser",
        steps: [
            { id: "loginAsSalesUser", executionTime: 1, dependencies: [] }
        ]
    },
    {
        id: "LoginAsDealDeskUser",
        steps: [
            { id: "loginAsDealDeskUser", executionTime: 1, dependencies: [] }
        ]
    },
    {
        id: "LoginAsAdmin",
        steps: [
            { id: "loginAsAdmin", executionTime: 1, dependencies: [] }
        ]
    },
    {
        id: "FillCustomerDetails",
        steps: [
            { id: "goToSettings", executionTime: 2, dependencies: ["loginAsSalesUser"] },
            { id: "fillInputFields", executionTime: 1, dependencies: ["goToSettings"] },
            { id: "clickSaveButton", executionTime: 1, dependencies: ["fillInputFields"] }
        ]
    },
    {
        id: "GetSalesTitleText",
        steps: [
            { id: "getSalesTitleText", executionTime: 3, dependencies: ["loginAsSalesUser", "goToSettings"] },
            { id: "logout", executionTime: 1, dependencies: [] }
        ]
    },

    {
        id: "CheckSalesTitleInvisibility",
        steps: [
            { id: "goToSettings", executionTime: 3, dependencies: ["loginAsDealDeskUser"] },
            { id: "checkSalesTitleInvisibility", executionTime: 1, dependencies: ["goToSettings"] }
        ]
    },
    {
        id: "CreateEducationOpportunity",
        steps: [
            { id: "createEducationOpportunity", executionTime: 15, dependencies: [] },
            { id: "cloneOffer", executionTime: 10, dependencies: [] }
        ]
    },
    {
        id: "GenerateExcelReport",
        steps: [
            { id: "generateExcelReport", executionTime: 5, dependencies: ["createEducationOpportunity"] }
        ]
    },
    {
        id: "SendFeedback",
        steps: [
            { id: "clickFeedbackButton", executionTime: 3, dependencies: ["loginAsSalesUser", "createEducationOpportunity"] },
            { id: "chooseScoreNeutral", executionTime: 2, dependencies: ["clickFeedbackButton"] },
            { id: "writeFeedback", executionTime: 2, dependencies: ["chooseScoreNeutral"] },
            { id: "clickSendFeedbackButton", executionTime: 1, dependencies: ["writeFeedback"] },
            { id: "assertModalFeedbackSent", executionTime: 3, dependencies: ["clickSendFeedbackButton"] }
        ]
    },

    {
        id: "ViewFeedback",
        steps: [
            { id: "navigateToFeedbackMenu", executionTime: 3, dependencies: ["loginAsAdmin"] },
            { id: "expectFeedbackPresent", executionTime: 3, dependencies: ["loginAsAdmin", "navigateToFeedbackMenu"] }
        ]
    },
    {
        id: "CreateAndPublishOpportunity",
        steps: [
            { id: "createOpportunityDefaultDetails", executionTime: 15, dependencies: ["loginAsSalesUser"] },
            { id: "publishOpportunity", executionTime: 5, dependencies: ["createOpportunityDefaultDetails"] },
            { id: "checkStatusSentToDealManagement", executionTime: 3, dependencies: ["publishOpportunity"] }
        ]
    },
    {
        id: "AcceptOfferAsDealDesk",
        steps: [
            { id: "reviewOpportunities", executionTime: 3, dependencies: ["loginAsDealDeskUser", "createOpportunityDefaultDetails"] },
            { id: "acceptOpportunity", executionTime: 7, dependencies: ["reviewOpportunities"] },
            { id: "goToActiveOffers", executionTime: 3, dependencies: ["acceptOpportunity"] },
            { id: "confirmStatusPublished", executionTime: 5, dependencies: ["goToActiveOffers"] }
        ]
    },
    {
        id: "CommentAsCustomer",
        steps: [
            { id: "openCreatedOpportunityCustomer", executionTime: 4, dependencies: ["loginAsCustomer"] },
            { id: "addComment", executionTime: 3, dependencies: ["openCreatedOpportunityCustomer"] },
            { id: "checkCommentPresent", executionTime: 3, dependencies: ["addComment"] }
        ]
    },
    {
        id: "CommentAsSalesUser",
        steps: [
            { id: "openCreatedOpportunitySalesUser", executionTime: 4, dependencies: ["loginAsSalesUser"] },
            { id: "addComment", executionTime: 3, dependencies: ["openCreatedOpportunitySalesUser"] },
            { id: "checkCommentPresent", executionTime: 3, dependencies: ["addComment"] }
        ]
    },
    {
        id: "ShareOpportunity",
        steps: [
            { id: "shareOpportunity", executionTime: 5, dependencies: ["loginAsSalesUser", "createOpportunityDefaultDetails"] }
        ]
    },
    {
        id: "PublishOpportunity",
        steps: [
            { id: "publishOpportunity", executionTime: 5, dependencies: ["loginAsSalesUser", "createOpportunityDefaultDetails"] },
            { id: "checkStatusSentToDealManagement", executionTime: 3, dependencies: ["publishOpportunity"] }
        ]
    }
];

type Step = {
    id: string;
    executionTime: number;
    dependencies?: string[];
};

type TestCase = {
    id: string;
    steps: Step[];
    dependencies: string[];
};

type Individual = TestCase[];

// Parameters for the genetic algorithm
const populationSize = 1000;
const mutationRate = 0.03;
const numGenerations = 1000;
const minUniqueTestSteps = 3;

// Fitness function
function calculateFitness(individual: Individual): number {
    let coverage = 0;
    let totalTime = 0;

    for (let testCase of individual) {
        coverage += testCase.steps.length;
        totalTime += testCase.steps.reduce((acc, step) => acc + step.executionTime, 0);
    }

    return coverage / totalTime;
}

// Helper function to mutate the steps within a test case
function mutateSteps(steps: Step[]): Step[] {
    let mutatedSteps = [...steps];
    let shuffledSteps = [...steps].sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffledSteps.length; i++) {
        if (Math.random() < mutationRate) {
            mutatedSteps[i] = shuffledSteps[i];
        }
    }

    mutatedSteps = mutatedSteps.filter(
        (step, index, self) => index === self.findIndex((s) => s.id === step.id)
    );

    if (mutatedSteps.length < minUniqueTestSteps) {
        const uniqueSteps = mutatedSteps.map((step) => step.id);
        const remainingSteps = shuffledSteps.filter((step) => !uniqueSteps.includes(step.id));
        mutatedSteps.push(...remainingSteps.slice(0, minUniqueTestSteps - mutatedSteps.length));
    }

    return mutatedSteps;
}

// Mutation operation
function mutate(individual: Individual): Individual {
    let mutatedIndividual = [...individual];

    for (let i = 0; i < mutatedIndividual.length; i++) {
        if (Math.random() < mutationRate) {
            let mutatedTestCase = JSON.parse(JSON.stringify(mutatedIndividual[i]));
            mutatedTestCase.steps = mutateSteps(mutatedTestCase.steps);
            mutatedIndividual[i] = mutatedTestCase;
        }
    }

    // Merge test cases based on dependencies
    for (let i = 0; i < mutatedIndividual.length; i++) {
        for (let j = i + 1; j < mutatedIndividual.length; j++) {
            let testCase1 = mutatedIndividual[i];
            let testCase2 = mutatedIndividual[j];

            // Check if testCase1 depends on testCase2 or vice versa
            if (
                testCase1.dependencies.some((dependency) =>
                    testCase2.steps.some((step) => step.id === dependency)
                ) ||
                testCase2.dependencies.some((dependency) =>
                    testCase1.steps.some((step) => step.id === dependency)
                )
            ) {
                // Merge the test cases
                let mergedTestCase = mergeTestCases(testCase1, testCase2);

                // Update the individual with the merged test case
                mutatedIndividual.splice(j, 1);
                mutatedIndividual.splice(i, 1, mergedTestCase);
            }
        }
    }

    return mutatedIndividual;
}

// Helper function to perform crossover on a single test case
function crossoverTestCase(testCase1, testCase2) {
    const crossedOverSteps = [];
    const crossedOverDependencies = [];
    const dependencies1 = Array.from(testCase1.dependencies);
    const dependencies2 = Array.from(testCase2.dependencies);

    for (const step1 of testCase1.steps) {
        console.log('Step:', step1.id);
        console.log('Crossed-Over Steps:', crossedOverSteps);
        console.log('Step Dependencies:', step1.dependencies);

        if (dependencies2.includes(step1.id) || !crossedOverSteps.concat(crossedOverSteps.slice(0, crossedOverSteps.length - 1)).some((step) => step.id === step1.id)) {
            const dependenciesMet = !step1.dependencies || step1.dependencies.every((dependencyId) =>
                crossedOverSteps.some((step) => step.id === dependencyId)
            );

            if (dependenciesMet) {
                crossedOverSteps.push({ ...step1 });
                crossedOverDependencies.push(...step1.dependencies);
            }
        }
    }

    for (const step2 of testCase2.steps) {
        if (!dependencies1.includes(step2.id) && !crossedOverSteps.concat(crossedOverSteps.slice(0, crossedOverSteps.length - 1)).some((step) => step.id === step2.id)) {
            const dependenciesMet = !step2.dependencies || step2.dependencies.every((dependencyId) =>
                crossedOverSteps.some((step) => step.id === dependencyId)
            );

            if (dependenciesMet) {
                crossedOverSteps.push({ ...step2 });
                crossedOverDependencies.push(...step2.dependencies);
            }
        }
    }


    // Remove duplicate dependencies
    const uniqueDependencies = Array.from(new Set(crossedOverDependencies));

    return {
        id: `${testCase1.id}-${testCase2.id}`,
        steps: crossedOverSteps,
        dependencies: uniqueDependencies,
    };
}

// Crossover operation
function crossover(individual1, individual2) {
    let offspring = [...individual1];

    for (let i = 0; i < offspring.length; i++) {
        if (Math.random() < mutationRate) {
            const testCase1 = offspring[i];
            const testCase2 = individual2[i];
            const crossedOverTestCase = crossoverTestCase(testCase1, testCase2);

            // Check if the crossed-over test case already exists in the offspring
            const isDuplicate = offspring.some((testCase) =>
                testCase.steps.length === crossedOverTestCase.steps.length &&
                testCase.steps.every((step, index) => step.id === crossedOverTestCase.steps[index].id)
            );

            if (!isDuplicate) {
                offspring[i] = crossedOverTestCase;
            }
        }
    }

    return offspring;
}


// Selection operation
function select(population: Individual[], fitnesses: number[]): Individual {
    let totalFitness = fitnesses.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalFitness;
    let runningSum = 0;
    for (let i = 0; i < population.length; i++) {
        runningSum += fitnesses[i];
        if (runningSum > random) {
            return population[i];
        }
    }
    return population[population.length - 1];
}

// Merging operation
function mergeTestCases(testCase1: TestCase, testCase2: TestCase): TestCase {
    const mergedSteps = [...testCase1.steps, ...testCase2.steps];
    const mergedDependencies = Array.from(
        new Set<string>([...testCase1.dependencies, ...testCase2.dependencies])
    );

    return {
        id: `${testCase1.id}-${testCase2.id}`,
        steps: mergedSteps,
        dependencies: mergedDependencies,
    };
}

// Initialization
let population: Individual[] = [];
for (let i = 0; i < populationSize; i++) {
    let individual: Individual = testCaseData.map((testCase) => ({
        id: testCase.id,
        steps: testCase.steps.map((step) => ({ ...step })),
        dependencies: [],
    }));
    population.push(individual);
}

// Elitism rate
const elitismRate = 0.1;
const numElites = Math.round(populationSize * elitismRate);

// Main loop
for (let generation = 0; generation < numGenerations; generation++) {
    let fitnesses = population.map(calculateFitness);

    // Rank individuals by fitness
    let rankedPopulation: Individual[] = population
        .map((individual, index) => ({ individual, fitness: fitnesses[index] }))
        .sort((a, b) => b.fitness - a.fitness) // Descending order
        .map((item) => item.individual);

    // Elitism: directly carry the best individuals to the next generation
    let newPopulation: Individual[] = rankedPopulation.slice(0, numElites);

    // Generate the rest of the new population
    while (newPopulation.length < populationSize) {
        let parent1 = select(population, fitnesses);
        let parent2 = select(population, fitnesses);
        let offspring = crossover(parent1, parent2);
        offspring = mutate(offspring);
        newPopulation.push(offspring);
    }

    population = newPopulation;
}

// Function to remove redundant test cases
function removeRedundantTestCases(population: Individual[]): Individual[] {
    const uniqueTestCases: TestCase[] = [];
    const testCaseIds: Set<string> = new Set();

    for (const individual of population) {
        for (const testCase of individual) {
            const testCaseId = getTestCaseId(testCase);
            if (!testCaseIds.has(testCaseId)) {
                uniqueTestCases.push(testCase);
                testCaseIds.add(testCaseId);
            }
        }
    }

    return [uniqueTestCases.filter((testCase) => testCase.steps.length >= minUniqueTestSteps)]; // Wrap the unique test cases in an array
}

// Remove redundant test cases from the final population
population = removeRedundantTestCases(population);

// Function to generate a unique test case ID
function getTestCaseId(testCase: TestCase): string {
    const stepIds = testCase.steps.map((step) => step.id).join("-");
    const dependencyIds = testCase.dependencies ? testCase.dependencies.join("-") : "";
    return `${testCase.id}-${stepIds}-${dependencyIds}`;
}

// Output the best individual from the last generation
let bestIndividual = population.reduce((acc, cur) =>
    calculateFitness(cur) > calculateFitness(acc) ? cur : acc
);

// Convert the best individual to JSON format
let result = bestIndividual
    .slice(0, Math.min(15, bestIndividual.length)) // Select the first 15 test cases or fewer if the population is smaller
    .map((testCase, index) => {
        let testCaseObj = {
            id: testCase.id,
            generatedTestId: `GTC-${index + 1}`,
            steps: testCase.steps.map((step, stepIndex) => ({
                id: step.id,
                executionTime: step.executionTime,
            })),
        };
        return testCaseObj;
    });

// Write the result to a JSON file
fs.writeFileSync("test_cases.json", JSON.stringify(result, null, 2));
console.log("Test cases written to test_cases.json file.");