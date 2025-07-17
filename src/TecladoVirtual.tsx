import './TecladoVirtual.css';

const linhas = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['⇧', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'],
    ['   ', '.', '↵']
];

function TecladoVirtual({ onKeyPress, onBackspace }) {
    return (
        <div className="teclado-container">
            {linhas.map((linha, i) => (
                <div key={i} className="linha">
                    {linha.map((tecla, j) => {
                        if (tecla === ' ') {
                            return <button key={j} className="espaco" onClick={() => onKeyPress(' ')} />;
                        }
                        if (tecla === '⌫') {
                            return <button key={j} className="backspace" onClick={onBackspace}>{tecla}</button>;
                        }
                        if (tecla === '↵') {
                            return <button key={j} className="enter" onClick={() => onKeyPress('\n')}>{tecla}</button>;
                        }
                        return (
                            <button key={j} onClick={() => onKeyPress(tecla)}>
                                {tecla}
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

export default TecladoVirtual;
