const functions = require('firebase-functions');
const firebase = require('firebase-admin');


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.criarUsuario = functions.https.onRequest((request, response) => {
    try {
        let usuario = {
            nome: request.body.nome,
            usuario: request.body.usuario,
            email: request.body.email,
            categorias: [
                request.body.categorias,
            ],
            grupo: {
                ativo: false,
            },
            convites: [],
            solicitacoes: []
        }

        firebase.firestore().collection('usuarios').add(usuario);
        
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

exports.criarGrupo = functions.https.onRequest((request, response) => {
    try {
        let grupo = {
            nome: request.body.nome,
            administrador: request.body.administrador.id,
            categorias: [
                request.body.categorias,
            ],
            categoriasPendentes: [
                request.body.categorias,
            ],
            membros: [
                {
                    id: request.body.administrador.id,
                    usuario: request.body.administrador.usuario,
                }
            ],
            convites: [],
            solicitacoes: [],
        }
        
        firebase.firestore().collection('grupos').add(grupo);	
        
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

exports.listagemUsuarios = functions.https.onRequest((request, response) => {
	let grupo = firebase.firestore().collection('grupos').get(request.body.grupo.id);
    let usuarios = [];
    
    let pendentes = grupo.categoriasPendentes;

    if(grupo.membros.length === 5 || ((pendentes.backend + pendentes.frontend + pendentes.designer + pendentes.gerente) === 0)) {
        let erro = {
            título: 'quantidadeMaxima',
            descricao: 'A quantidade máxima de membros ou de convites enviados já foi atingida.'
        }

        response.send(erro);
    }

	firebase.firestore().collection('usuarios').get()
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
exports.convidarUsuario = functions.https.onRequest((request, response) => {
    let grupo = firestore().collection('grupos').get(request.body.grupo.id);
	let usuario = firestore().collection('usuarios').get(request.body.usuario.id);

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
            grupo: request.body.grupo.id,
            status: 'aguardando'
        });

        grupo.convites.append({
            usuario: request.body.usuario.id,
            status: 'aguardando'
        });

        firebase.firestore().collection('grupos').doc(request.body.grupo.id).set(grupo)
        firebase.firestore().collection('usuarios').doc(request.body.usuario.id).set(usuario)
    }
    
    if(usuarios.length === 0) {
        var erro = {
            título: 'listaVazia',
            descricao: 'Não foi possível encontrar usuários com as categorias selecionadas.'
        }

        response.send(erro);
    }
    else {
        response.send(usuarios);
    }
});

exports.aceitarConvite = functions.https.onRequest((request, response) => {
    var usuario = firestore().collection('usuarios').get(request.body.usuario.id);
    var grupo = firestore().collection('grupos').get(request.body.grupo.id);
    
    var erro = {
		titulo: '',
		descricao: ''
    };
	
	var sucesso = {
		titulo: 'conviteAceito',
		descricao: 'O convite foi aceito e o usuário foi adicionado ao grupo.'
	};
    
    // flag que vai ser ativada caso o convite do grupo a ser aceito seja encontrado na lista de convites do usuario
    var flag = false;
	
    if(usuario.grupo.ativo) {
        erro.titulo = 'usuarioJaEmGrupo';
        erro.descricao = 'O usuário já faz parte de um grupo.';
            
        return erro;
    }
    else {
        usuario.convites.map((convite) => {
            if(convite.grupo === request.body.grupo.id) {
                // define status do convite como aceito para o usuário
                convite.status = 'aceito';
                
                // adiciona informações do grupo ao qual o usuário pertence
                usuario.grupo.ativo = true;
                usuario.grupo.id = request.body.grupo.id;
                usuario.grupo.nome = grupo.nome;

                // adicionando usuario na lista de membros do grupo
                let membro = {
                    id: request.body.usuario.id,
                    usuario: usuario.usuario
                }

                grupo.membros.push(membro);

                // define status do convite como aceito no grupo
                grupo.convites.map((convite) => {
                    if(convite.usuario === request.body.usuario.id) {
                        convite.status = 'aceito';
                    }
                });

                // atualizando informações no firestore
                firestore().collection('usuarios').doc(request.body.usuario.id).set(usuario);
                firestore().collection('grupos').doc(request.body.grupo.id).set(grupo);

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

exports.recusarConvite = functions.https.onRequest((request, response) => {
    var usuario = firestore().collection('usuarios').get(request.body.usuario.id);
    var grupo = firestore().collection('grupos').get(request.body.grupo.id);
    
    var erro = {
		titulo: '',
		descricao: ''
    };
	
	var sucesso = {
		titulo: 'conviteNegado',
		descricao: 'O convite foi negado e o usuário não foi adicionado ao grupo.'
	};
    
    // flag que vai ser ativada caso o convite do grupo a ser aceito seja encontrado na lista de convites do usuario
    var flag = false;
    
    // já faz parte de um grupo, realmente não tem porque negar convite
    if(usuario.grupo.ativo) {
        erro.titulo = 'usuarioJaEmGrupo';
        erro.descricao = 'O usuário já faz parte de um grupo.';
            
        return erro;
    }
    else {
        usuario.convites.map((convite) => {
            if(convite.grupo === request.body.grupo.id) {
                // define status do convite como negado para o usuário
                convite.status = 'negado';

                // define status do convite como negado no grupo
                grupo.convites.map((convite) => {
                    if(convite.usuario === request.body.usuario.id) {
                        convite.status = 'negado';
                    }
                });

                // atualizando informações no firestore
                firestore().collection('usuarios').doc(request.body.usuario.id).set(usuario);
                firestore().collection('grupos').doc(request.body.grupo.id).set(grupo);

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

exports.listagemGrupos = functions.https.onRequest((request, response) => {
    var usuario = firestore().collection('usuarios').get(request.body.usuario.id);
    var grupos = [];

    firebase.firestore().collection('grupos').get()
    .then((snapshot) => {
        snapshot.forEach((grupo) => {
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
        var erro = {
            título: 'listaVazia',
            descricao: 'Não foi possível encontrar grupos com as categorias selecionadas.'
        }

        response.send(erro);
    }
    else {
        response.send(usuarios);
    }	
});

// https://firebase.google.com/docs/firestore/query-data/queries?authuser=0
// https://firebase.google.com/docs/functions/get-started?authuser=0
// https://firebase.google.com/docs/functions/?authuser=0