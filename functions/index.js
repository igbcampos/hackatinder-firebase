const functions = require('firebase-functions');
const firebase = require('firebase-admin');

firebase.initializeApp();

exports.criarUsuario = functions.https.onRequest(async (request, response) => {
    try {
        let body = JSON.parse(request.body);

        let usuario = {
            nome: body.nome,
            usuario: body.usuario,
            email: body.email,
            categorias: body.categorias,
            grupo: {
                ativo: false
            },
            convites: [],
            solicitacoes: []
        }

        // verificar se email e nome de usuário já existem

        // console.log('Body: ', body);
        // console.log('Usuario: ', usuario);

        await firebase.firestore().collection('usuarios').add(usuario)
        .then((snapshot) => {
            console.log("id:", snapshot.id);
        });

        let sucesso = {
            titulo: 'usuarioCriado',
            descricao: 'Usuário criado com sucesso.',
        }

        response.send(sucesso);
    }
    catch(error) {
        let erro = {
            titulo: 'usuarioNaoCriado',
            descricao: 'Não foi possível criar o usuário.',
        };

        response.send(erro);
    }
});

exports.criarGrupo = functions.https.onRequest(async (request, response) => {
    try {
        let body = JSON.parse(request.body);

        let grupo = {
            nome: body.nome,
            administrador: body.usuario.id,
            categorias: body.categorias,
            categoriasPendentes: body.categorias,
            membros: [
                {
                    id: body.usuario.id,
                    usuario: body.usuario.usuario,
                }
            ],
            convites: [],
            solicitacoes: [],
        }
        
        // criar um slug para o grupo

        await firebase.firestore().collection('grupos').add(grupo)
        .then((snapshot) => {
            console.log("id:", snapshot.id);
        });	
        
        let sucesso = {
            titulo: 'grupoCriado',
            descricao: 'Grupo criado com sucesso.'
        };

        response.send(sucesso);
    }
    catch(error) {
        let erro = {
            titulo: 'grupoNaoCriado',
            descricao: 'Não foi possível criar o grupo.',
        };

        response.send(erro);
    }
});

exports.listagemUsuarios = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);

	let grupo = {};
    await firebase.firestore().collection('grupos').doc(body.grupo.id).get()
    .then((snapshot) => {
        grupo = snapshot.data();
    });

    let usuarios = [];
    
    let pendentes = grupo.categoriasPendentes;

    if(grupo.membros.length === 5 || ((pendentes.backend + pendentes.frontend + pendentes.designer + pendentes.gerente) === 0)) {
        let erro = {
            título: 'quantidadeMaxima',
            descricao: 'A quantidade máxima de membros ou de convites enviados já foi atingida.'
        }

        response.send(erro);
    }

    await firebase.firestore().collection('usuarios').get()
	.then((snapshot) => {
        snapshot.forEach((usuario) => {
            usuario = usuario.data()

            if(!usuario.grupo.ativo) {
                usuario.categorias.map((categoria) => {
                    if((pendentes.backend > 0) && (categoria === 'backend')) {
                        usuarios.push(usuario);
                    }
                    else if((pendentes.frontend > 0) && (categoria === 'frontend')) {
                        usuarios.push(usuario);
                    }
                    else if((pendentes.designer > 0) && (categoria === 'designer')) {
                        usuarios.push(usuario);
                    }
                    else if((pendentes.gerente > 0) && (categoria === 'gerente')) {
                        usuarios.push(usuario);
                    }
                });
            }
        });
    })
    .catch((error) => {
        let erro = {
            título: 'erro',
            descricao: 'Algo deu errado.'
        }

        response.send(erro);
    });
    
    if(usuarios.length === 0) {
        let erro = {
            título: 'listaVazia',
            descricao: 'Não foi possível encontrar usuários com as categorias selecionadas.'
        }

        response.send(erro);
    }
    else {
        response.send(usuarios);
    }
});

// deve mesmo ficar tão amarrado às categorias?
exports.convidarUsuario = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);

    let grupo = {}
    await firebase.firestore().collection('grupos').doc(body.grupo.id).get()
    .then((snapshot) => {
        grupo = snapshot.data()
    });

    let usuario = {};
    await firebase.firestore().collection('usuarios').doc(body.usuario.id).get()
    .then((snapshot) => {
        usuario = snapshot.data()
    });

    let pendentes = grupo.categoriasPendentes;
    let flag = false;

    if(usuario.grupo.ativo) {
        let erro = {
            titulo: 'usuarioJaEmGrupo',
            descricao: 'O usuário já faz parte de um grupo.'
        };

        response.send(erro);
    }
    else {
        usuario.categorias.map((categoria) => {
            if((pendentes.backend > 0) && (categoria === 'backend')) {
                flag = true;
                pendentes.backend -= 1;
            }
            else if((pendentes.frontend > 0) && (categoria === 'frontend')) {
                flag = true;
                pendentes.frontend -= 1;
            }
            else if((pendentes.designer > 0) && (categoria === 'designer')) {
                flag = true;
                pendentes.designer -= 1;
            }
            else if((pendentes.gerente > 0) && (categoria === 'gerente')) {
                flag = true;
                pendentes.gerente -= 1;
            }
        });
    }

    // verificar se o usuario ja recebeu um convite desse grupo.

    if(flag) {
        usuario.convites.push({
            grupo: body.grupo.id,
            status: 'aguardando'
        });

        grupo.convites.push({
            usuario: body.usuario.id,
            status: 'aguardando'
        });

        await firebase.firestore().collection('grupos').doc(body.grupo.id).set(grupo)
        await firebase.firestore().collection('usuarios').doc(body.usuario.id).set(usuario)
    
        let sucesso = {
            titulo: 'conviteEnviado',
            descricao: 'O convite foi enviado ao usuário.'
        };
    
        response.send(sucesso);
    }
});

// negar outros convites e solicitacoes do usuario
exports.aceitarConvite = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let grupo = {}
    await firebase.firestore().collection('grupos').doc(body.grupo.id).get()
    .then((snapshot) => {
        grupo = snapshot.data()
    });
    let usuario = {};
    await firebase.firestore().collection('usuarios').doc(body.usuario.id).get()
    .then((snapshot) => {
        usuario = snapshot.data()
    });
    
    let erro = {
		titulo: '',
		descricao: ''
    };
	
	let sucesso = {
		titulo: 'conviteAceito',
		descricao: 'O convite foi aceito e o usuário foi adicionado ao grupo.'
	};
    
    // flag que vai ser ativada caso o convite do grupo a ser aceito seja encontrado na lista de convites do usuario
    let flag = false;
	
    if(usuario.grupo.ativo) {
        erro.titulo = 'usuarioJaEmGrupo';
        erro.descricao = 'O usuário já faz parte de um grupo.';
            
        return erro;
    }
    else {
        usuario.convites.map(async (convite) => {
            if(convite.grupo === body.grupo.id) {
                // define status do convite como aceito para o usuário
                convite.status = 'aceito';
                
                // adiciona informações do grupo ao qual o usuário pertence
                usuario.grupo.ativo = true;
                usuario.grupo.id = body.grupo.id;
                usuario.grupo.nome = grupo.nome;

                // adicionando usuario na lista de membros do grupo
                let membro = {
                    id: body.usuario.id,
                    usuario: usuario.usuario
                }

                grupo.membros.push(membro);

                // define status do convite como aceito no grupo
                grupo.convites.map((convite) => {
                    if(convite.usuario === body.usuario.id) {
                        convite.status = 'aceito';
                    }
                });

                // atualizando inforawaitmações no firestore
                await firebase.firestore().collection('usuarios').doc(body.usuario.id).set(usuario);
                await firebase.firestore().collection('grupos').doc(body.grupo.id).set(grupo);

                flag = true;
            }
        });
    }

    if(flag) {
        response.send(sucesso);
    }
    else {
        erro.titulo = 'conviteNaoEncontrado'
        erro.descricao = 'O usuário não possui convite do grupo citado.'
        
        response.send(erro);
    }
});

exports.negarConvite = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let grupo = {}
    await firebase.firestore().collection('grupos').doc(body.grupo.id).get()
    .then((snapshot) => {
        grupo = snapshot.data()
    });
    let usuario = {};
    await firebase.firestore().collection('usuarios').doc(body.usuario.id).get()
    .then((snapshot) => {
        usuario = snapshot.data()
    });
    
    let erro = {
		titulo: '',
		descricao: ''
    };
	
	let sucesso = {
		titulo: 'conviteNegado',
		descricao: 'O convite foi negado e o usuário não foi adicionado ao grupo.'
	};
    
    // flag que vai ser ativada caso o convite do grupo a ser aceito seja encontrado na lista de convites do usuario
    let flag = false;
    
    // já faz parte de um grupo, realmente não tem porque negar convite
    if(usuario.grupo.ativo) {
        erro.titulo = 'usuarioJaEmGrupo';
        erro.descricao = 'O usuário já faz parte de um grupo.';
            
        return erro;
    }
    else {
        usuario.convites.map(async (convite) => {
            if(convite.grupo === body.grupo.id) {
                // define status do convite como negado para o usuário
                convite.status = 'negado';

                // define status do convite como negado no grupo
                grupo.convites.map((convite) => {
                    if(convite.usuario === body.usuario.id) {
                        convite.status = 'negado';
                    }
                });

                // atualizando inforawaitmações no firestore
                await firebase.firestore().collection('usuarios').doc(body.usuario.id).set(usuario);
                await firebase.firestore().collection('grupos').doc(body.grupo.id).set(grupo);

                flag = true;
            }
        });
    }

    if(flag) {
        response.send(sucesso);
    }
    else {
        erro.titulo = 'conviteNaoEncontrado'
        erro.descricao = 'O usuário não possui convite do grupo citado.'
        
        response.send(erro);
    }
});

exports.listagemGrupos = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);
    let usuario = {};
    await firebase.firestore().collection('usuarios').doc(body.usuario.id).get()
    .then((snapshot) => {
        usuario = snapshot.data()
    });
    let grupos = [];

   await firebase.firestore().collection('grupos').get()
    .then((snapshot) => {
        snapshot.forEach((grupo) => {
            grupo = grupo.data();
            console.log(grupo);
            // verificando somente pela quantidade total, e as quantidades de cada categoria? Acho que basta adicionar 
            // ... || grupos.membros.length < (gurpo.categorias.frontend + ... + grupo.categorias.gerente)) {
            if(grupo.membros.length < 5) {
                let pendentes = grupo.categoriasPendentes;

                usuario.categorias.map((categoria) => {
                    if((pendentes.backend > 0) && (categoria === 'backend')) {
                        grupos.push(grupo);
                    }
                    else if((pendentes.frontend > 0) && (categoria === 'frontend')) {
                        grupos.push(grupo);
                    }
                    else if((pendentes.designer > 0) && (categoria === 'designer')) {
                        grupos.push(grupo);
                    }
                    else if((pendentes.gerente > 0) && (categoria === 'gerente')) {
                        grupos.push(grupo);
                    }
                });
            }
        });
    });
    
    if(grupos.length === 0) {
        let erro = {
            título: 'listaVazia',
            descricao: 'Não foi possível encontrar grupos com as categorias selecionadas.'
        }

        response.send(erro);
    }
    else {
        response.send(grupos);
    }	
});

// qualquer um, de qualquer categoria pode solicitar entrar em um grupo?
exports.solicitarGrupo = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);

    let grupo = {}
    await firebase.firestore().collection('grupos').doc(body.grupo.id).get()
    .then((snapshot) => {
        grupo = snapshot.data()
    });

    let usuario = {};
    await firebase.firestore().collection('usuarios').doc(body.usuario.id).get()
    .then((snapshot) => {
        usuario = snapshot.data()
    });
    
    let erro = {
		titulo: '',
		descricao: ''
    };

    // verificar se o usuario ja fez uma solicitacao a esse grupo.

    if(usuario.grupo.ativo) {
        erro.titulo = 'usuarioJaEmGrupo';
        erro.descricao = 'O usuário já faz parte de um grupo.';

        response.send(erro);
    }
    else if(grupo.membros.length === 5) {
        // verificar também a quantidade de convites ativos / categorias pendentes
        erro.titulo = 'grupoCheio';
        erro.descricao = 'O grupo solicitado já está cheio.';

        response.send(erro);
    }
    else {
        usuario.solicitacoes.push({
            grupo: body.grupo.id,
            status: 'aguardando'
        });

        grupo.solicitacoes.push({
            usuario: body.usuario.id,
            status: 'aguardando'
        });

        await firebase.firestore().collection('grupos').doc(body.grupo.id).set(grupo);
        await firebase.firestore().collection('usuarios').doc(body.usuario.id).set(usuario);

        let sucesso = {
            titulo: 'solicitacaoEnviada',
            descricao: 'A silicitação foi enviada ao grupo.'
        };
        
        response.send(sucesso);
    }
});

// negar outros convites e solicitacoes do usuario
exports.aceitarSolicitacao = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);

    let grupo = {}
    await firebase.firestore().collection('grupos').doc(body.grupo.id).get()
    .then((snapshot) => {
        grupo = snapshot.data()
    });

    let usuario = {};
    await firebase.firestore().collection('usuarios').doc(body.usuario.id).get()
    .then((snapshot) => {
        usuario = snapshot.data()
    });
    
    let erro = {
		titulo: '',
		descricao: ''
    };
	
	let sucesso = {
		titulo: 'solicitacaoAceita',
		descricao: 'A solicitação foi aceita e o usuário foi adicionado ao grupo.'
	};
    
    // flag que vai ser ativada caso o convite do grupo a ser aceito seja encontrado na lista de convites do usuario
    let flag = false;
	
    if(usuario.grupo.ativo) {
        erro.titulo = 'usuarioJaEmGrupo';
        erro.descricao = 'O usuário já faz parte de um grupo.';
            
        return erro;
    }
    else if(grupo.membros.length === 5) {
        // verificar também a quantidade de convites ativos / categorias pendentes
        erro.titulo = 'grupoCheio';
        erro.descricao = 'O grupo já está cheio, portanto não pode aceitar mais solicitações.';

        response.send(erro);
    }
    else {
        // decrescer a quantidade de pendencias para a categoria do usuario aceito
        grupo.solicitacoes.map(async (solicitacao) => {
            if(solicitacao.usuario === body.usuario.id) {
                // define status da solicitacao como aceita para o grupo
                solicitacao.status = 'aceito';
                
                // adiciona informações do grupo ao qual o usuário pertence
                usuario.grupo.ativo = true;
                usuario.grupo.id = body.grupo.id;
                usuario.grupo.nome = grupo.nome;

                // adicionando usuario na lista de membros do grupo
                let membro = {
                    id: body.usuario.id,
                    usuario: usuario.usuario
                }

                grupo.membros.push(membro);

                // define status da solicitacao como aceita no usuário
                usuario.solicitacoes.map((solicitacao) => {
                    if(solicitacao.grupo === body.grupo.id) {
                        solicitacao.status = 'aceito';
                    }
                });

                // atualizando inforawaitmações no firestore
                await firebase.firestore().collection('usuarios').doc(body.usuario.id).set(usuario);
                await firebase.firestore().collection('grupos').doc(body.grupo.id).set(grupo);

                flag = true;
            }
        });
    }

    if(flag) {
        response.send(sucesso);
    }
    else {
        erro.titulo = 'solicitacaoNaoEncontrado'
        erro.descricao = 'O grupo não possui solicitação do usuário citado.'
        
        response.send(erro);
    }
});

exports.negarSolicitacao = functions.https.onRequest(async (request, response) => {
    let body = JSON.parse(request.body);

    let grupo = {}
    await firebase.firestore().collection('grupos').doc(body.grupo.id).get()
    .then((snapshot) => {
        grupo = snapshot.data()
    });

    let usuario = {};
    await firebase.firestore().collection('usuarios').doc(body.usuario.id).get()
    .then((snapshot) => {
        usuario = snapshot.data()
    });
    
    let erro = {
		titulo: '',
		descricao: ''
    };
	
	let sucesso = {
		titulo: 'solicitacaoNegada',
		descricao: 'A solicitacao foi negada e o usuário não foi adicionado ao grupo.'
	};
    
    // flag que vai ser ativada caso o convite do grupo a ser aceito seja encontrado na lista de convites do usuario
    let flag = false;
    
    // já faz parte de um grupo, realmente não tem porque negar convite
    if(usuario.grupo.ativo) {
        erro.titulo = 'usuarioJaEmGrupo';
        erro.descricao = 'O usuário já faz parte de um grupo.';
            
        return erro;
    }
    else {
        grupo.solicitacoes.map(async (solicitacao) => {
            if(solicitacao.usuario === body.usuario.id) {
                // define status da solicitacao como negada para o grupo
                solicitacao.status = 'negado';

                // define status da solicitacao como negada no usuário
                usuario.solicitacoes.map((solicitacao) => {
                    if(solicitacao.grupo === body.grupo.id) {
                        solicitacao.status = 'negado';
                    }
                });

                // atualizando inforawaitmações no firestore
                await firebase.firestore().collection('usuarios').doc(body.usuario.id).set(usuario);
                await firebase.firestore().collection('grupos').doc(body.grupo.id).set(grupo);

                flag = true;
            }
        });
    }

    if(flag) {
        response.send(sucesso);
    }
    else {
        erro.titulo = 'solicitacaoNaoEncontrada'
        erro.descricao = 'O grupo não possui solicitação do usuário citado.'
        
        response.send(erro);
    }
});

// https://firebase.googleawait.com/docs/firestore/query-data/queries?authuser=0
// https://firebase.google.com/docs/functions/get-started?authuser=0
// https://firebase.google.com/docs/functions/?authuser=0