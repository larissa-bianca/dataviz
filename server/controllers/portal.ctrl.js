const ResocieObs = require("../../config/resocie.json").observatory;

const getDataviz = (req, res) => {
	const developers = [
		{
			name: "Larissa Bianca",
			text: "É estudante da  Universidade de Brasília pelo curso de Ciência da Computação. Tem interesse nas áreas de Lógica, Métodos Formais e Matemática da Computação. ",
			github: "https://github.com/larissa-tekuan",
			img: "/imagens/Larissa.jpeg",
		},
		{
			name: "Rodrigo  Guimarães",
			text: "Estudante de Engenharia de Computação pela Universidade de Brasília. Tem interesse pela área educacional. ",
			github: "https://github.com/rodrigofegui",
			cv: "http://lattes.cnpq.br/9277938174017919",
			img: "/imagens/Rodrigo.jpg",
		},
		{
			name: "Samuel Couto",
			text: "É estudante da Ciência da Computação na Universidade de Brasília. Tem interesse na área de inteligência artificial. ",
			github: "https://github.com/SCouto97/",
			img: "/imagens/Samuel.jpeg",
		},
	];

	res.render("quemSomos", {
		title: "Quem Somos",
		developers: developers,
	});
};

const getPlotInitial = (req, res) => {
	const medias = getInitialMedias();
	const categories = getInitialCategories();

	res.render("plot", {
		title: "Espaço Exploratório",
		medias,
		categories,
	});
};

const getInitialMedias = () => {
	const socialMedia = ResocieObs.socialMidia;
	const medias = [];

	/* eslint-disable */
	for (midia in socialMedia) {				
		const aux = socialMedia[midia];
		const list = {
			lower: aux,
			upper: capitalize(aux),
		};

		medias.push(list);
	}
	/* eslint-enable */
	return medias;
};

const getInitialCategories = () => {
	const resocieCategories = ResocieObs.categories;
	const categories = [];

	/* eslint-disable */
	for (category in resocieCategories) {					
		const aux = resocieCategories[category];
		const list = {
			val: category,
			name: capitalize(aux.toLowerCase()),
		};

		categories.push(list);
	}
	/* eslint-enable */
	return categories;
};

const capitalize = (str) => {
	/* eslint-disable */
	str = str.charAt(0).toUpperCase() + str.slice(1);
	str = str.replace(/\s\w/g, l => l.toUpperCase());
	/* eslint-enable */

	return str;
};

module.exports = {
	getDataviz,
	getPlotInitial,
};
