// Módulo do MongoDB, banco de dados NoSQL
const mongoose = require("mongoose");

const nameModel = "facebookAccounts";
const collectionName = "accounts";
/**
 * Planilha que irá povoar o BD:
 * https://docs.google.com/spreadsheets/d/1yesZHlR3Mo0qpuH7VTFB8_zyl6p_H-b1khh-wlB3O_Q/edit#gid=0
 * Identificação primária das colunas para os dados do Facebook:
 * 		Nome			= Linha: 3[2], Coluna: A[0],
 *		Conta			= Linha: 2[1], Coluna: D[3],
 *		Curtidas		= Linha: 2[1], Coluna: E[4],
 *		Seguidos		= Linha: 2[1], Coluna: F[5],
 *		Data de Coleta	= Linha: 2[1], Coluna: G[6],
 *		Nome das Planilhas: "Grupos/<mes> <ano>",
 *			<mes> => nome em 3 letras,
 *			<ano> => 4 digitos
 *		Data nas Planilhas: dd/mm/aaaa
 *		Classe: 03-13 => Frente/Coletivos,
 *				16-53 => Organizações da Sociedade Civil,
 *				56-77 => Pré-Candidatura à Presidência
 * Verificar o significado dos "Não usar --";
 * Vale a pena já desenvolver os métodos de pesquisa básicos?
 * Como testar as interfaces com o MongoDB?
*/

const facebookHistory = {
	likes: {
		type: Number,
	},
	followers: {
		type: Number,
	},
	date: {
		type: Date,
		Default: Date.now,
	},
};

const facebookAccountSchema = new mongoose.Schema({
	name: {
		type: String,
	},
	class: {
		type: String,
	},
	link: {
		type: String,
		trim: true,
	},
	history: [facebookHistory],
});

module.exports = mongoose.model(nameModel, facebookAccountSchema, collectionName);
