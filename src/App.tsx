import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

function App() {
  const [cpf, setCpf] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [etapa, setEtapa] = useState(() => {
    return sessionStorage.getItem('autenticado') === 'true' ? 'cpf' : 'senha';
  }); const [senha, setSenha] = useState('');

  const mostrarToast = (msg) => {
    setMensagem(msg);
    setTimeout(() => setMensagem(''), 3000);
  };

  const validarSenha = () => {
    if (senha === 'phygital2025') {
      sessionStorage.setItem('autenticado', 'true');
      setEtapa('cpf');
    } else {
      mostrarToast('Senha incorreta.');
    }
  };

  const inserirNumero = (num) => {
    if (cpf.length < 11) setCpf(prev => prev + num);
  };

  const removerUltimo = () => setCpf(prev => prev.slice(0, -1));

  const formatarCPF = (cpf) =>
    cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  const enviarCPF = () => {
    if (cpf.length !== 11) return mostrarToast('CPF incompleto.');
    setEtapa('final');
  };

  const confirmarCadastro = async () => {
    const cpfFormatado = formatarCPF(cpf);
    const { data, error } = await supabase
      .from('cadastro_jogadores')
      .select('cpf')
      .eq('cpf', cpfFormatado);

    if (error) return mostrarToast('Erro ao verificar CPF.');
    if (data.length > 0) return mostrarToast('Este CPF já participou do jogo.');

    const { error: insertError } = await supabase
      .from('cadastro_jogadores')
      .insert([{ cpf: cpfFormatado }]);

    if (insertError) return mostrarToast('Erro ao cadastrar CPF.');

    mostrarToast('CPF cadastrado com sucesso!');
    setCpf('');
    setEtapa('cpf');
  };

  const formatarCPFParcial = (cpf) => {
    return cpf
      .replace(/\D/g, '') // Remove qualquer não número
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  return (
    <div className="container">
      {mensagem && <div className="toast show">{mensagem}</div>}

      {etapa === 'senha' && (
        <div className="modal">
          <div className="modal-cpf-container">
            <h3>Digite a senha para acessar:</h3>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
            />
            <button className="btn-continuar" onClick={validarSenha}>Entrar</button>
          </div>
        </div>
      )}

      {etapa === 'cpf' && (
        <div className="modal">
          <div className="modal-cpf-container">
            <h3>Insira seu CPF:</h3>
            <input value={formatarCPFParcial(cpf)} readOnly />
            <div className="teclado">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n, i) => (
                <button key={i} onClick={() => inserirNumero(n)}>{n}</button>
              ))}
              <button className="remover" onClick={removerUltimo}>x</button>
            </div>
            <button className="btn-continuar" onClick={enviarCPF}>Continuar</button>
          </div>
        </div>
      )}

      {etapa === 'final' && (
        <div className="modal">
          <div className="modal-cpf-container">
            <h3>Você confirma o CPF abaixo?</h3>
            <input value={formatarCPF(cpf)} readOnly />
            <button className="btn-continuar" onClick={confirmarCadastro}>Sim, confirmar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;