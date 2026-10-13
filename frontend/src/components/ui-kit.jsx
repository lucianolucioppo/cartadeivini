export const PageHeader = ({ eyebrow, title, description, actions, testid }) => (
  <header className="flex flex-col gap-6 border-b border-avorio-200 pb-8 md:flex-row md:items-end md:justify-between" data-testid={testid}>
    <div className="animate-rise">
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1 className="mt-2 font-serif text-4xl font-semibold leading-[0.95] tracking-tight text-bordeaux-900 sm:text-5xl lg:text-6xl">
        {title}
      </h1>
      {description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted md:text-base">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-3 print:hidden">{actions}</div>}
  </header>
);

export const Page = ({ children, className = "" }) => (
  <div className={`mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12 ${className}`}>{children}</div>
);

export const EmptyState = ({ icon: Icon, title, text, action, testid }) => (
  <div className="flex flex-col items-center border border-dashed border-oro/40 bg-avorio-100/50 px-6 py-20 text-center" data-testid={testid}>
    {Icon && <Icon className="h-10 w-10 text-oro" strokeWidth={1} />}
    <h3 className="mt-5 font-serif text-2xl text-bordeaux-900">{title}</h3>
    {text && <p className="mt-2 max-w-md text-sm text-ink-muted">{text}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

export const GoldButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-bordeaux-700 px-5 text-sm font-medium tracking-wide text-oro-light shadow-[inset_0_0_0_1px_rgba(197,160,89,0.45)] transition-[background-color,transform] duration-200 hover:bg-bordeaux-600 active:scale-[0.98] disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

export const GhostButton = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`inline-flex h-11 items-center justify-center gap-2 rounded-sm border border-oro/60 bg-transparent px-5 text-sm font-medium tracking-wide text-bordeaux-800 transition-[background-color,color] duration-200 hover:bg-oro/15 disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);
