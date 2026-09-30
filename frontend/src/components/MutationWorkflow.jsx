const steps = [
  { id: 1, title: 'Owner initiates', description: 'The current owner submits the buyer, price, and encrypted sale deed.' },
  { id: 2, title: 'Buyer accepts', description: 'The named buyer confirms the pending transfer from the Citizen dashboard.' },
  { id: 3, title: 'Registrar approves', description: 'The Sub-Registrar verifies and approves the accepted sale deed.' },
  { id: 4, title: 'Talathi certifies', description: 'After 30 days without an objection, the Talathi records the mutation.' },
];

export default function MutationWorkflow({ highlightedSteps = [] }) {
  return (
    <section className="rounded-3xl border border-earth-200 bg-white p-6 shadow-md dark:border-earth-900/60 dark:bg-gray-900">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-500">Ownership mutation</p>
        <h2 className="mt-1 text-2xl font-bold text-earth-800 dark:text-earth-300">Four-step transfer workflow</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Initial land registration is separate from these transfer steps.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => {
          const isHighlighted = highlightedSteps.includes(step.id);
          return (
            <div
              key={step.id}
              className={isHighlighted
                ? 'rounded-2xl border border-earth-500 bg-earth-100 p-4 shadow-sm dark:border-earth-600 dark:bg-earth-900/40'
                : 'rounded-2xl border border-earth-100 bg-earth-50 p-4 dark:border-gray-800 dark:bg-gray-800/70'}
            >
              <div className="mb-3 flex items-center gap-3">
                <span className={isHighlighted
                  ? 'flex h-8 w-8 items-center justify-center rounded-full bg-earth-600 text-sm font-black text-white'
                  : 'flex h-8 w-8 items-center justify-center rounded-full bg-earth-200 text-sm font-black text-earth-800 dark:bg-earth-800 dark:text-earth-200'}
                >
                  {step.id}
                </span>
                <h3 className="font-bold text-earth-900 dark:text-earth-200">{step.title}</h3>
              </div>
              <p className="text-sm leading-5 text-gray-600 dark:text-gray-400">{step.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
