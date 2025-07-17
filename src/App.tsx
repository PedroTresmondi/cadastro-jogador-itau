import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import 'react-phone-input-2/lib/style.css';
import PhoneInput from 'react-phone-input-2';


import './App.css';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

function App() {
  const [autenticado, setAutenticado] = useState<boolean>(sessionStorage.getItem('autenticado') === 'true');
  const [senhaInput, setSenhaInput] = useState('');
  const senhaCorreta = 'phygital2025';

  const [modalAberto, setModalAberto] = useState(false);


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
    const cpfFinal = estrangeiro ? 'estrangeiro' : cpfFormatado;

    // Verifica duplicidade de CPF se NÃO for estrangeiro
    if (!estrangeiro) {
      const { data: cpfData, error: cpfError } = await supabase
        .from('cadastro_jogadores')
        .select('cpf')
        .eq('cpf', cpfFinal);

      if (cpfError) return mostrarToast('Erro ao verificar CPF.');
      if (cpfData.length > 0) return mostrarToast('Este CPF já participou.');
    }

    // Verifica duplicidade de telefone (sempre)
    const { data: telData, error: telError } = await supabase
      .from('cadastro_jogadores')
      .select('telefone')
      .eq('telefone', telefone);

    if (telError) return mostrarToast('Erro ao verificar telefone.');
    if (telData.length > 0) return mostrarToast('Este telefone já participou.');

    // Insere cadastro
    const { error: insertError } = await supabase
      .from('cadastro_jogadores')
      .insert([{ nome, email, telefone, cpf: cpfFinal }]);

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
              {form.estrangeiro ? (
                <PhoneInput
                  country={'us'}
                  value={form.telefone}
                  onChange={(tel) => setForm((prev) => ({ ...prev, telefone: tel }))}
                  inputStyle={{ width: '100%' }}
                />
              ) : (
                <input
                  id="telefone"
                  type="tel"
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                />
              )}
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
                Ao me registrar, concordo com a <a href="#" onClick={() => setModalAberto(true)}>política de privacidade</a>
              </label>
            </div>
            {modalAberto && (
              <div className="modal-termos">
                <div className="modal-termos-content">
                  <p>
                    Os dados pessoais coletados pelo Itaú Unibanco serão utilizados para a finalidade de envio de ofertas nos termos da Lei nº 13.709/2018 – LGPD.
                    Para mais informações quanto ao tratamento dos seus dados pessoais, acesse a nossa&nbsp;
                    <a href="https://www.itau.com.br/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>.
                  </p>
                  <button className="btn-fechar" onClick={() => setModalAberto(false)}>Fechar</button>
                </div>
              </div>
            )}


            {/* <TecladoVirtual onKeyPress={handleKeyPress} onBackspace={handleBackspace} /> */}

            <button className="btn-continuar" onClick={handleSubmit}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  );

}


export default App;
