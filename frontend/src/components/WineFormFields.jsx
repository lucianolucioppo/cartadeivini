import { Switch } from "@/components/ui/switch";
import { TIPOLOGIE, REGIONI, FORMATI, DENOMINAZIONI_BASE, merge } from "@/lib/constants";

const Field = ({ label, required, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="eyebrow">{label}{required && <span className="text-bordeaux-600"> *</span>}</span>
    <div className="mt-1.5">{children}</div>
  </label>
);

const TextInput = ({ name, form, set, list, ...props }) => (
  <input value={form[name]} onChange={(e) => set(name, e.target.value)} list={list} data-testid={`wine-form-${name}-input`}
    className="field" autoComplete="off" {...props} />
);

const TEXT_FIELDS = [
  ["nome", "Nome del vino", { required: true, wide: true, placeholder: "es. Barolo Cannubi" }],
  ["produttore", "Produttore o cantina", { required: true, wide: true, list: "dl-produttore" }],
  ["regione", "Regione", { list: "dl-regione" }],
  ["denominazione", "Denominazione", { list: "dl-denominazione", placeholder: "es. Barolo DOCG" }],
  ["tipologia", "Tipologia", { list: "dl-tipologia", placeholder: "es. Rosso" }],
  ["vitigno", "Vitigno", { list: "dl-vitigno", placeholder: "es. Nebbiolo 100%" }],
];

const DETAIL_FIELDS = [
  ["annata", "Annata", { inputMode: "numeric", placeholder: "es. 2019 oppure s.a." }],
  ["formato", "Formato", { list: "dl-formato" }],
  ["gradazione", "Gradazione alcolica", { placeholder: "es. 13,5% vol" }],
  ["temperatura_servizio", "Temperatura di servizio", { placeholder: "es. 16–18 °C" }],
  ["prezzo_acquisto", "Prezzo di acquisto (€)", { inputMode: "decimal", placeholder: "0,00" }],
  ["fornitore", "Fornitore", { list: "dl-fornitore", placeholder: "es. Distribuzione Vini Srl" }],
  ["prezzo_carta", "Prezzo in carta (€)", { inputMode: "decimal", placeholder: "0,00" }],
];

const renderFields = (fields, form, set) =>
  fields.map(([name, label, { required, wide, ...props }]) => (
    <Field key={name} label={label} required={required} className={wide ? "sm:col-span-2" : ""}>
      <TextInput name={name} form={form} set={set} {...props} />
    </Field>
  ));

const VisibleToggle = ({ form, set }) => (
  <div className="flex items-center justify-between gap-4 border border-avorio-300 bg-white/60 px-4 py-3 sm:col-span-2">
    <div>
      <div className="eyebrow">Carta digitale</div>
      <div className="text-sm text-ink">Visibile ai clienti nella carta digitale</div>
    </div>
    <Switch checked={form.visibile} onCheckedChange={(v) => set("visibile", v)} data-testid="wine-form-visibile-switch" />
  </div>
);

export const WineFormFields = ({ form, set }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {renderFields(TEXT_FIELDS, form, set)}
    <Field label="Affinamento" className="sm:col-span-2">
      <textarea value={form.affinamento} onChange={(e) => set("affinamento", e.target.value)} rows={3} maxLength={500} data-testid="wine-form-affinamento-input"
        className="field h-auto py-2.5 leading-relaxed" placeholder="es. 18 mesi in barrique di rovere francese, poi 12 mesi in bottiglia" />
      <span className="mt-1 block text-right text-[11px] text-ink-muted" data-testid="affinamento-char-count">{form.affinamento.length}/500</span>
    </Field>
    {renderFields(DETAIL_FIELDS, form, set)}
    <VisibleToggle form={form} set={set} />
    <Field label="Note descrittive" className="sm:col-span-2">
      <textarea value={form.note} onChange={(e) => set("note", e.target.value)} rows={5} data-testid="wine-form-note-input"
        className="field h-auto py-2.5 leading-relaxed" placeholder="Profumi, gusto, abbinamenti, temperatura di servizio…" />
    </Field>
  </div>
);

const Options = ({ id, values }) => (
  <datalist id={id}>{values.map((v) => <option key={v} value={v} />)}</datalist>
);

export const WineFormSuggestions = ({ facets }) => (
  <>
    <Options id="dl-produttore" values={facets.produttore || []} />
    <Options id="dl-regione" values={merge(REGIONI, facets.regione || [])} />
    <Options id="dl-denominazione" values={merge(DENOMINAZIONI_BASE, facets.denominazione || [])} />
    <Options id="dl-tipologia" values={merge(TIPOLOGIE, facets.tipologia || [])} />
    <Options id="dl-vitigno" values={facets.vitigno || []} />
    <Options id="dl-formato" values={merge(FORMATI, facets.formato || [])} />
    <Options id="dl-fornitore" values={facets.fornitore || []} />
  </>
);
