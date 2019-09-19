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
            administrador: body.administrador.id,
            categorias: [
                body.categorias,
            ],
            categoriasPendentes: [
                body.categorias,
            ],
            membros: [
                {
                    id: body.administrador.id,
                    usuario: body.administrador.usuario,
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
            usuario.categorias.map((categoria) => {
                switch(categoria) {
                    case 'backend':
                        if(pendentes.backend > 0) {
                            usuarios.push(usuario);
                        }

                        break;
                    case 'frontend':
                        if(pendentes.frontend > 0) {
                            usuarios.push(usuario);
                        }

                        break;
                    case 'designer':
                        if(pendentes.designer > 0) {
                            usuarios.push(usuario);
                        }
                        
                        break;
                    case 'gerente':
                        if(pendentes.gerente > 0) {
                            usuarios.push(usuario);
                        }

                        break;
                }
            });
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

    // verificar se o usuario ja recebeu um convite desse grupo.

    if(flag) {
        usuario.convites.append({
            grupo: body.grupo.id,
            status: 'aguardando'
        });

        grupo.convites.append({
            usuario: body.usuario.id,
            status: 'aguardando'
        });

        await firebase.firestore().collection('grupos').doc(body.grupo.id).set(grupo)
        await firebase.firestore().collection('usuarios').doc(body.usuario.id).set(usuario)
    }
    
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

exports.recusarConvite = functions.https.onRequest(async (request, response) => {
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
            console.log(JSON.stringify(grupo));
            // verificando somente pela quantidade total, e as quantidades de cada categoria? Acho que basta adicionar 
            // ... || grupos.membros.length < (gurpo.categorias.frontend + ... + grupo.categorias.gerente)) {
            if(grupo.membros.length < 5) {
                let pendentes = grupo.categoriasPendentes;

                usuario.categorias.map((categoria) => {
                    switch(categoria) {
                        case 'backend':
                            if(pendentes.backend > 0) {
                                grupos.push(grupo);
                            }

                            break;
                        case 'frontend':
                            if(pendentes.frontend > 0) {
                                grupos.push(grupo);
                            }

                            break;
                        case 'designer':
                            if(pendentes.designer > 0) {
                                grupos.push(grupo);
                            }
                            
                            break;
                        case 'gerente':
                            if(pendentes.gerente > 0) {
                                grupos.push(grupo);
                            }

                            break;
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
        response.send(usuarios);
    }	
});

// https://firebase.googleawait.com/docs/firestore/query-data/queries?authuser=0
// https://firebase.google.com/docs/functions/get-started?authuser=0
// https://firebase.google.com/docs/functions/?authuser=0