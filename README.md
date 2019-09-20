## Hackatinder

### Especificações

Um usuário só pode participar de um grupo, antes de aceitar solicitação/convite, verificar se o usuário não está em um grupo.

Um usuário pode ser convidado, ou solicitar, a participar de um grupo. Se aceitar um convite, todos os outros convites e solicitações devem ser negados (talvez apagados, mas seria bom só negar para manter um histórico). O mesmo ocorre para solicitações, se um grupo acietar a solicitação do usuário para participar todas as solicitações e convites devem ser negados.

Se um usuário já estiver em um grupo ele não deve ser retornado na listagem de usuários, não deve receber convites, nem fazer solicitações.

usuario = {
	id: 'kejhr098342ur',
	nome: 'Gabriel',
	usuario: 'igbcampos',
	email: 'gabriel@gmail.com',
	categorias: [
		'backend',
	],
	grupo: {
		ativo: true,
		id: 'jjrh8r32r32u0',
		nome: 'Grupo 1',
	},
	convites: [
		{
			grupo: '1234',
			status: 'aceito',
		},
		{	
			grupo: '4321',
			status: 'recusado',
		},
		{
			grupo: '2222',
			status: 'aguardando',
		},
	],
	solicitacoes: [
		{
			grupo: '6666',
			status: 'aguardando',
		},
		{
			grupo: '8888',
			status: 'recusado',
		},
		{
			grupo: '4444',
			status: 'aguardando'
		},
	]
}

O grupo tem nas categorias especificadas pelo usuários a quantidade pessoas de cada categoria que ele deseja ter no grupo, a medida que for enviando convites (a quantidade de convites é limitada em 4), ou aceitando solicitações de usuários, a quantidade de categorias será decrescida.

Todos os convites, ou solicitações devem ser recusados automaticamente quando a quantidade de membros máxima for atingida (5 membros).

Sempre que um convite for enviado, ou um membro for adicionado (se o membro pertencer a uma categoria solicitada, só deve permitir que membros das categorias especificadas solicitem?), a quantidade pendente naquela categoria deve ser decrescida.

grupo = {
	id: 'jjrh8r32r32u0',
	nome: 'Grupo 1',
	administrador: 'kejhr098342ur',
	categorias: [
		frontend: 2,
		backend: 2,
		designer: 0,
		gerente: 0,
	],
	categoriasPendentes: [
		frontend: 1,
		backend: 2,
		designer: 0,
		gerente: 0,
	],
	membros: [
		{
			id: 'kejhr098342ur',
			usuario: 'igbcampos',
		}
	],
	convites: [
		{
			usuario: '123456',
			status: 'aguardando',
		},
	],
	solicitacoes: [
		{
			usuario: '123456',
			status: 'aguardando',
		},
		{
			usuario: '123456',
			status: 'aguardando',
		},
	],
}

### Endpoints

Todas as requisições usam o método POST e os dados devem ser enviados no corpo da requisição com o Content-Type text/plain. Abaixo estão os endpoints e o modelo de corpo para cada requisição.

https://us-central1-hackatinder.cloudfunctions.net/aceitarConvite
{
	"grupo": {
		"id": "9jtePZ4OeEIhtO6RJUft"
	},
	"usuario": {
		"id": "klGjVc8YIJ9aZH50VL44"
	}	
}

https://us-central1-hackatinder.cloudfunctions.net/aceitarSolicitacao
{
	"grupo": {
		"id": "9jtePZ4OeEIhtO6RJUft"
	},
	"usuario": {
		"id": "klGjVc8YIJ9aZH50VL44"
	}	
}

https://us-central1-hackatinder.cloudfunctions.net/convidarUsuario
{
	"grupo": {
		"id": "9jtePZ4OeEIhtO6RJUft"
	},
	"usuario": {
		"id": "klGjVc8YIJ9aZH50VL44"
	}	
}


https://us-central1-hackatinder.cloudfunctions.net/criarGrupo
{
	"nome": "Grupo 1",
	"usuario": "ajose",
	"email": "ajose@mail.com",
	"usuario": {
		"id": "klGjVc8YIJ9aZH50VL44",
		"usuario": "ajose"
	}
	"categorias": {
		"frontend": 1,
		"backend": 1,
		"design": 1,
		"gerente": 0
	}
}


https://us-central1-hackatinder.cloudfunctions.net/criarUsuario
{	
	"nome": "Antonio José",	
	"usuario": "ajose",
	"email": "ajose@mail.com",
	"categorias": [
		"backend"
	]
}


https://us-central1-hackatinder.cloudfunctions.net/listagemGrupos
{
	"usuario": {
		"id": "klGjVc8YIJ9aZH50VL44"
	}	
}


https://us-central1-hackatinder.cloudfunctions.net/listagemUsuarios
{
	"grupo": {
		"id": "9jtePZ4OeEIhtO6RJUft"
	}	
}

https://us-central1-hackatinder.cloudfunctions.net/negarConvite
{
	"grupo": {
		"id": "9jtePZ4OeEIhtO6RJUft"
	},
	"usuario": {
		"id": "klGjVc8YIJ9aZH50VL44"
	}	
}


https://us-central1-hackatinder.cloudfunctions.net/negarSolicitacao
{
	"grupo": {
		"id": "9jtePZ4OeEIhtO6RJUft"
	},
	"usuario": {
		"id": "klGjVc8YIJ9aZH50VL44"
	}	
}


https://us-central1-hackatinder.cloudfunctions.net/solicitarGrupo
{
	"grupo": {
		"id": "9jtePZ4OeEIhtO6RJUft"
	},
	"usuario": {
		"id": "klGjVc8YIJ9aZH50VL44"
	}	
}