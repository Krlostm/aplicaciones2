import { Children, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

// El select conserva validación y envío del formulario; la interacción visual es compartida.
export default function Select({
  children,
  id,
  name,
  value: controlledValue,
  defaultValue = '',
  onChange,
  disabled,
  ...props
}) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const value = controlledValue ?? localValue;
  function change(event) {
    setLocalValue(event.target.value);
    onChange?.(event);
  }
  const options = Children.toArray(children).filter((child) => child?.type === 'option');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const [menu, setMenu] = useState({ above: false, height: 280 });
  useLayoutEffect(() => {
    if (!open || !trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const above = below < 200 && rect.top > below;
    setMenu({ above, height: Math.max(44, Math.min(280, (above ? rect.top : below) - 16)) });
  }, [open]);
  const selected = options.findIndex((o) => String(o.props.value) === String(value));
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  useEffect(() => {
    if (open)
      document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, id]);
  function choose(index) {
    const option = options[index];
    if (!option || option.props.disabled) return;
    change({ target: { id, name: name || id, value: String(option.props.value) } });
    setOpen(false);
    trigger.current?.focus();
  }
  function keyboard(e) {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
      const direction = e.key === 'ArrowUp' ? -1 : 1;
      let index =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? options.length - 1
            : open
              ? active + direction
              : Math.max(selected, 0);
      index = Math.max(0, Math.min(options.length - 1, index));
      while (
        options[index]?.props.disabled &&
        index + direction >= 0 &&
        index + direction < options.length
      )
        index += direction;
      setActive(index);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (open) choose(active);
      else {
        setActive(Math.max(selected, 0));
        setOpen(true);
      }
    } else if (e.key.length === 1) {
      const index = options.findIndex(
        (o) =>
          String(o.props.children).toLocaleLowerCase().startsWith(e.key.toLocaleLowerCase()) &&
          !o.props.disabled,
      );
      if (index >= 0) {
        setActive(index);
        setOpen(true);
      }
    }
  }
  return (
    <div
      className={`styled-select ${open ? 'is-open' : ''}`}
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <select
        {...props}
        id={id}
        name={name || id}
        value={value}
        onChange={change}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className="styled-select-native"
        onInvalid={() => trigger.current?.focus()}
      >
        {children}
      </select>
      <button
        ref={trigger}
        type="button"
        className="styled-select-trigger"
        role="combobox"
        aria-invalid={props['aria-invalid']}
        aria-describedby={props['aria-describedby']}
        aria-label={`Elegir ${document.getElementById(id)?.labels?.[0]?.textContent || name || id}`}
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        disabled={disabled}
        onKeyDown={keyboard}
        onClick={() => {
          setActive(Math.max(selected, 0));
          setOpen(!open);
        }}
      >
        <span>{options[selected]?.props.children || 'Selecciona una opción'}</span>
        <ChevronDown size={18} />
      </button>
      {open && (
        <div
          className={`styled-select-options ${menu.above ? 'opens-above' : ''}`}
          style={{ maxHeight: menu.height }}
          role="listbox"
          id={`${id}-list`}
          aria-label="Opciones"
        >
          {options.map((option, index) => (
            <button
              key={option.props.value}
              id={`${id}-option-${index}`}
              type="button"
              role="option"
              aria-selected={index === selected}
              aria-disabled={!!option.props.disabled}
              tabIndex={-1}
              className={index === active ? 'is-highlighted' : ''}
              disabled={option.props.disabled}
              onPointerMove={() => setActive(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(index)}
            >
              <span>{option.props.children}</span>
              {index === selected && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
