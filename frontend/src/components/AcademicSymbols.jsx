const symbols = [
  ['π', '{ }'],
  ['∫', 'f(x)'],
  ['∑', '</>'],
  ['x²', '∞'],
];
export default function AcademicSymbols({ section = 0 }) {
  return (
    <div className="subject-ornaments" aria-hidden="true">
      {symbols[section % symbols.length].map((symbol, index) => (
        <span className={`subject-float subject-float-${index + 1}`} key={symbol}>
          <span className={`subject-tile subject-tile-${(section + index) % 3}`}>{symbol}</span>
        </span>
      ))}
    </div>
  );
}
