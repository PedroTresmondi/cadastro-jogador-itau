import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

function App() {
  const [autenticado, setAutenticado] = useState<boolean>(sessionStorage.getItem('autenticado') === 'true');
  const [senhaInput, setSenhaInput] = useState('');
  const senhaCorreta = 'phygital2025';

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    politica: false,
    estrangeiro: false
  });
  const [mensagem, setMensagem] = useState('');
  const [campoAtivo, setCampoAtivo] = useState<'nome' | 'email' | 'telefone' | 'cpf' | null>(null);

  const mostrarToast = (msg) => {
    setMensagem(msg);
    setTimeout(() => setMensagem(''), 5000);
  };

  const formatarCPF = (cpf) => {
    return cpf.replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatarTelefone = (tel) => {
    return tel.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const handleInputClick = (campo) => {
    setCampoAtivo(campo);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;

    if (name === 'telefone') {
      val = formatarTelefone(val);
    }

    setForm((prev) => ({
      ...prev,
      [name]: val
    }));
  };

  const handleKeyPress = (char: string) => {
    if (!campoAtivo) return;
    setForm((prev) => {
      let novoValor = prev[campoAtivo] + char;
      if (campoAtivo === 'cpf') novoValor = formatarCPF(novoValor);
      if (campoAtivo === 'telefone') novoValor = formatarTelefone(novoValor);
      return {
        ...prev,
        [campoAtivo]: novoValor
      };
    });
  };

  const handleBackspace = () => {
    if (!campoAtivo) return;
    setForm((prev) => {
      const valorAtual = prev[campoAtivo];
      let novoValor = valorAtual.slice(0, -1);
      if (campoAtivo === 'cpf') novoValor = formatarCPF(novoValor.replace(/\D/g, ''));
      if (campoAtivo === 'telefone') novoValor = formatarTelefone(novoValor.replace(/\D/g, ''));
      return {
        ...prev,
        [campoAtivo]: novoValor
      };
    });
  };

  const validarEmail = (email: string) => {
    return /.+@.+\..+/.test(email);
  };

  const handleSubmit = async () => {
    const { nome, email, telefone, cpf, politica, estrangeiro } = form;
    if (!nome || !email || !telefone || (!estrangeiro && cpf.replace(/\D/g, '').length !== 11)) {
      return mostrarToast('Preencha todos os campos corretamente.');
    }

    if (!validarEmail(email)) {
      return mostrarToast('Informe um e-mail válido.');
    }

    if (!politica) {
      return mostrarToast('É necessário aceitar a política de privacidade.');
    }

    const cpfFormatado = formatarCPF(cpf);

    if (!estrangeiro) {
      const { data, error } = await supabase
        .from('cadastro_jogadores')
        .select('cpf')
        .eq('cpf', cpfFormatado);

      if (error) return mostrarToast('Erro ao verificar CPF.');
      if (data.length > 0) return mostrarToast('Este CPF já participou.');
    }

    const { error: insertError } = await supabase
      .from('cadastro_jogadores')
      .insert([{ nome, email, telefone, cpf: estrangeiro ? null : cpfFormatado }]);

    if (insertError) return mostrarToast('Erro ao cadastrar.');
    mostrarToast('Cadastro realizado com sucesso!');
    localStorage.setItem('nomeJogador', estrangeiro ? nome : cpfFormatado);
  };

  const autenticar = () => {
    if (senhaInput === senhaCorreta) {
      sessionStorage.setItem('autenticado', 'true');
      setAutenticado(true);
    } else {
      mostrarToast('Senha incorreta');
    }
  };

  return (
    <div className="container">
      {mensagem && <div className="toast show">{mensagem}</div>}

      {!autenticado && (
        <div className="modal-auth">
          <div className="modal-auth-container">
            <h3>Digite a senha para continuar</h3>
            <input
              type="password"
              placeholder="Senha"
              value={senhaInput}
              onChange={(e) => setSenhaInput(e.target.value)}
            />
            <button className="btn-continuar" onClick={autenticar}>Entrar</button>
          </div>
        </div>
      )}

      {autenticado && (
        <div className="modal">
          <div className="modal-cpf-container">
            <div className="input-group">
              <label htmlFor="nome">Nome</label>
              <input id="nome" type="text" name="nome" value={form.nome} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label htmlFor="email">E-mail</label>
              <input id="email" type="email" name="email" value={form.email} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label htmlFor="telefone">Telefone</label>
              <input id="telefone" type="tel" name="telefone" value={form.telefone} onChange={handleChange} />
            </div>

            {!form.estrangeiro && (
              <div className="input-group">
                <label htmlFor="cpf">CPF</label>
                <input id="cpf" type="text" name="cpf" value={formatarCPF(form.cpf)} onChange={handleChange} maxLength={14} />
              </div>
            )}

            <div className="checkboxes">
              <label className="checkbox-inline">
                <input type="checkbox" name="estrangeiro" checked={form.estrangeiro} onChange={handleChange} />
                Sou estrangeiro
              </label>

              <label className="checkbox-inline">
                <input type="checkbox" name="politica" checked={form.politica} onChange={handleChange} />
                Ao me registrar, concordo com a <a href="#">política de privacidade</a>
              </label>
            </div>

            {/* <TecladoVirtual onKeyPress={handleKeyPress} onBackspace={handleBackspace} /> */}

            <button className="btn-continuar" onClick={handleSubmit}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
