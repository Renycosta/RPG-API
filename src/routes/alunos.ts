import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import nodemailer from "nodemailer"

const router = Router()

const alunoSchema = z.object({
    nome: z.string()
      .min(3, 'Nome deve possuir no mínimo com 3 caracteres')
      .max(40, 'Nome deve ter no máximo 40 caracteres'),
    turma: z.string()
      .min(2, 'Turma deve possuir no mínimo 2 caracteres')
      .max(3, 'Turma deve ter no máximo 3 caracteres'),
    responsavel: z.string()
      .min(3, 'Responsável deve possuir no mínimo com 3 caracteres')
      .max(40, 'Responsável deve ter no máximo 40 caracteres'),
    email: z.email(),
    obs: z.string().optional()
})

router.get("/", async (req, res) => {
    try {
        const alunos = await prisma.aluno.findMany()
        res.status(200).json(alunos)
    } catch (error) {
        res.status(500).json({ erro: "Erro no servidor" })
    }
})

router.post("/", async (req, res) => {
    const valida = alunoSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    // Desestrutura os dados validados
    const { nome, turma, responsavel, email, obs = "" } = valida.data

    try {
        const aluno = await prisma.aluno.create({
            data: { nome, turma, responsavel, email, obs }
        })
        res.status(201).json(aluno)
    } catch (error) {
        res.status(500).json({ error })
    }
})

router.put("/:id", async (req, res) => {
    // recebe o id passado como parâmetro
    const { id } = req.params

    const valida = alunoSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    // Desestrutura os dados validados
    const { nome, turma, responsavel, email, obs } = valida.data

    try {
        const aluno = await prisma.aluno.update({
            where: { id: Number(id) },
            data: { nome, turma, responsavel, email, obs }
        })
        res.status(200).json(aluno)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.delete("/:id", async (req, res) => {
    // recebe o id passado como parâmetro
    const { id } = req.params

    // realiza a exclusão da seleção
    try {
        const aluno = await prisma.aluno.delete({
            where: { id: Number(id) }
        })
        res.status(200).json(aluno)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.get('/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
        res.status(400).json({ erro: 'Código inválido' })
        return
    }

    try {
        const aluno = await prisma.aluno.findUnique({ 
            where: { id } 
        })

        if (!aluno) {
            res.status(404).json({ erro: 'Aluno não cadastrada' })
            return
        }

        res.status(200).json(aluno)
    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: 'Erro interno do servidor' })
    }
})

function gerarTabelaHTML(dados: any) {
  // Código Inicial, Dados do Aluno e Responsável, Cabeçalho da Tabela
  let html = `
    <html>
    <body style="font-family: Helvetica, Arial, sans-serif;">
    <h2>Cantina Escolar: Relatório de Vendas e Depósitos</h2>
    <h3>Aluno: ${dados.nome} - Turma: ${dados.turma}</h3>
    <h3>Responsável: ${dados.responsavel}</h3> 
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead style="background-color: rgb(195, 191, 191);">
        <tr>
          <th>Data e Hora</th>
          <th>Produto/Depósito</th>          
          <th>Valor R$:</th>
          <th>Débito R$</th>
          <th>Crédito R$</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Lançamentos de Depósitos
  let totalDepositos = 0;
  for (const deposito of dados.depositos) {
    totalDepositos += Number(deposito.valor)

    const data = new Date(deposito.data)

    const dataFormatada = data.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    html += `
      <tr>
        <td>${dataFormatada}</td>
        <td>Depósito</td>
        <td style="text-align: right;">${Number(deposito.valor).toLocaleString("pt-br", { minimumFractionDigits: 2 })}</td>
        <td> </td>
        <td style="text-align: right;">${Number(deposito.valor).toLocaleString("pt-br", { minimumFractionDigits: 2 })}</td>
      </tr>
    `;
  }

  // Lançamentos de Vendas
  let totalVendas = 0;
  for (const venda of dados.vendas) {
    totalVendas += venda.quant * Number(venda.preco)

    const data = new Date(venda.data)

    const dataFormatada = data.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    html += `
      <tr>
        <td>${dataFormatada}</td>
        <td>${venda.quant} x ${venda.produto.nome}</td>
        <td style="text-align: right;">${Number(venda.preco).toLocaleString("pt-br", { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right;">${(venda.quant * Number(venda.preco)).toLocaleString("pt-br", { minimumFractionDigits: 2 })}</td>
        <td> </td>
      </tr>
    `;
  }

  // Rodapé com totais
  html += `
      <tr style="font-weight: bold; background-color:rgb(235, 232, 232);">
        <td colspan="3" style="text-align: right;">Total Geral:</td>
        <td style="text-align: right;">R$ ${totalVendas.toLocaleString("pt-br", { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right;">R$ ${totalDepositos.toLocaleString("pt-br", { minimumFractionDigits: 2 })}</td>
      </tr>
  `;

  // Fechamento da tabela
  html += `
          </tbody>
        </table>
        <h3> Saldo Atual R$: ${(totalDepositos-totalVendas).toLocaleString("pt-br", { minimumFractionDigits: 2 })} </h3>
      </body>
    </html>
  `;

  return html;
}

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAILTRAP_EMAIL,
    pass: process.env.MAILTRAP_SENHA
  },
});

async function enviaEmail(dados: any) {

  const mensagem = gerarTabelaHTML(dados)

  const info = await transporter.sendMail({
    from: 'Cantina Escolar <cantina@gmail.com>',
    to: dados.email,
    subject: "Relatório de Vendas e Depósitos",
    text: "Relatório de Vendas...", // plain‑text body
    html: mensagem, // HTML body
  });

  console.log("Message sent:", info.messageId);
}

router.get("/email/:id", async (req, res) => {
  const { id } = req.params
  try {
    const alunos = await prisma.aluno.findFirst({
      where: { id: Number(id) },
      include: {
        depositos: true,
        vendas: {
          include: {
            produto: true
          }
        }
      }
    })

    enviaEmail(alunos)

    res.status(200).json(alunos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router