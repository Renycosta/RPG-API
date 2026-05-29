import { prisma } from "../../lib/prisma";
import { Classes } from "../../generated/prisma/enums";
import { Router } from "express"
import { z } from "zod"
import nodemailer from "nodemailer"

const router = Router()

export function calcularPontosPorNivel(nivel: number): number {
    return nivel * 20;
}

const personagemSchema = z.object({
    Nome_personagem: z.string()
        .min(3, 'Nome do personagem deve possuir no mínimo com 3 caracteres')
        .max(40, 'Nome do personagem deve ter no máximo 40 caracteres'),
    Classe: z.enum(Classes),
    Nivel: z.number()
        .positive('Valor deve ser um número positivo')
})

router.get("/", async (req, res) => {
    try {
        const personagens = await prisma.personagem.findMany({
          include: { PH: true }
        })
        res.status(200).json(personagens)
    } catch (error) {
        res.status(500).json({ erro: "Erro no servidor" })
    }
})

router.get('/:Id_personagem', async (req, res) => {
    const id = Number(req.params.Id_personagem)
    if (Number.isNaN(id)) {
        res.status(400).json({ erro: 'Código inválido' })
        return
    }

    try {
        const personagem = await prisma.personagem.findUnique({ 
            where: { Id_personagem: id } 
        })

        if (!personagem) {
            res.status(404).json({ erro: 'Personagem não cadastrada' })
            return
        }

        res.status(200).json(personagem)
    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: 'Erro interno do servidor' })
    }
})

router.post("/", async (req, res) => {
    const valida = personagemSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { Nome_personagem, Classe, Nivel } = valida.data

    const pontosCalculados = calcularPontosPorNivel(Nivel)

    try {
        const personagem = await prisma.personagem.create({
            data: { Nome_personagem, Classe, Nivel, Pontos: pontosCalculados }
        })
        res.status(201).json(personagem)
    } catch (error) {
        res.status(500).json({ error })
    }
})

router.put("/:Id_personagem", async (req, res) => {
    const { Id_personagem } = req.params

    const valida = personagemSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { Nome_personagem, Classe, Nivel } = valida.data

    try {
        const personagem = await prisma.personagem.update({
            where: { Id_personagem: Number(Id_personagem) },
            data: { Nome_personagem, Classe, Nivel }
        })
        res.status(200).json(personagem)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.delete("/:Id_personagem", async (req, res) => {
    const { Id_personagem } = req.params

    try {
        const personagem = await prisma.personagem.delete({
            where: { Id_personagem: Number(Id_personagem) }
        })
        res.status(200).json(personagem)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

function gerarTabelaHTML(dados: any) { 
  let html = ` 
    <html> 
    <body style="font-family: Helvetica, Arial, sans-serif;"> 
      <h1>Ficha do Personagem</h1> 
      <h2>${dados.Nome_personagem}</h2> 
      <h3>Classe: ${dados.Classe}</h3> 
      <h3>Nível: ${dados.Nivel}</h3> 
      <h3>Pontos disponíveis: ${dados.Pontos}</h3> 
      
      <hr> 
      
      <h2>Habilidades Compradas</h2> 
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;"> 
        <thead style="background-color: rgb(195, 191, 191);"> 
          <tr> 
            <th>Data</th> 
            <th>Habilidade</th> 
            <th>Tipo</th> 
            <th>Pontos Gastos</th> 
            <th>Nível Necessário</th> 
          </tr> 
        </thead> 
      <tbody> 
    ` 
    let totalPontos = 0 
    for (const compra of dados.CH) { 
      totalPontos += compra.Pontos_gastos 
      
      const data = new Date(compra.Data) 
      
      const dataFormatada = data.toLocaleString("pt-BR", { 
        timeZone: "America/Sao_Paulo", 
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric", 
        hour: "2-digit", 
        minute: "2-digit" 
      }) 
      
      html += ` 
        <tr> 
          <td>${dataFormatada}</td> 
          <td>${compra.Habilidade.Nome_habilidade}</td> 
          <td>${compra.Habilidade.Tipo}</td> 
          <td style="text-align: right;"> ${compra.Pontos_gastos} </td> 
          <td style="text-align: center;"> ${compra.Habilidade.Nivel_necessario} </td> 
        </tr> 
      ` 
    } 
    
    html += ` 
      <tr style="font-weight: bold; background-color:rgb(235, 232, 232);"> 
        <td colspan="3" style="text-align: right;"> Total de Pontos Gastos: </td> 
        <td style="text-align: right;"> ${totalPontos} </td> 
        <td></td> 
      </tr> 
    ` 
    
    html += ` 
      </tbody> 
        </table> 
        <h3> Pontos restantes: ${dados.Pontos} </h3> 
      </body> 
      </html> 
    ` 
    return html 
    } 
    
    const transporter = nodemailer.createTransport({ 
      host: "sandbox.smtp.mailtrap.io", 
      port: 2525, 
      secure: false, 
      auth: { 
        user: process.env.MAILTRAP_EMAIL, 
        pass: process.env.MAILTRAP_SENHA 
      }, 
    }) 
    
    async function enviaEmail(dados: any) { 
      const mensagem = gerarTabelaHTML(dados) 
      
      const info = await transporter.sendMail({ 
        from: 'RPG System <rpg@gmail.com>', 
        to: "teste@gmail.com", 
        subject: "Relatório do Personagem", 
        text: "Relatório completo do personagem", 
        html: mensagem 
      }) 
      
      console.log("Message sent:", info.messageId) 
    } 
    
    router.get("/email/:id", async (req, res) => { 
      const { id } = req.params 
      try { 
        const personagem = await prisma.personagem.findFirst({ 
          where: { 
            Id_personagem: Number(id) 
          }, 
          include: { 
            CH: { 
              include: { 
                Habilidade: true 
              } 
            } 
          } 
        }) 
        if (!personagem) { 
          res.status(404).json({ 
            erro: "Personagem não encontrado" 
          }) 
          return 
        } 
        await enviaEmail(personagem) 
        res.status(200).json(personagem) 
      } catch (error) { 
        res.status(500).json({ erro: "Erro interno do servidor" }) 
      } 
    })

export default router