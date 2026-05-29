import { prisma } from "../../lib/prisma";
import { Tipos } from "../../generated/prisma/enums";
import { Router } from "express"
import { z } from "zod"
// import nodemailer from "nodemailer"

const router = Router()

const habilidadeSchema = z.object({
    Nome_habilidade: z.string()
        .min(3, "Nome da habilidade deve possuir no mínimo 3 caracteres")
        .max(40, "Nome da habilidade deve possuir no máximo 40 caracteres"),
    Descricao: z.string()
        .min(10, "Descrição deve possuir no mínimo 10 caracteres")
        .max(120, "Descrição deve possuir no máximo 120 caracteres"),
    Tipo: z.enum(Tipos),
    Nivel_necessario: z.number()
        .int("O nível necessário deve ser um número inteiro")
        .positive("O nível necessário deve ser positivo"),
    Pontos_necessarios: z.number()
        .int("Os pontos necessários devem ser um número inteiro")
        .positive("Os pontos necessários devem ser positivos")
})

router.get("/", async (req, res) => {
    try {
        const habilidades = await prisma.habilidade.findMany()
        res.status(200).json(habilidades)
    } catch (error) {
        res.status(500).json({ erro: "Erro no servidor" })
    }
})

router.get('/:Id_habilidade', async (req, res) => {
    const id = Number(req.params.Id_habilidade)
    if (Number.isNaN(id)) {
        res.status(400).json({ erro: 'Código inválido' })
        return
    }

    try {
        const habilidade = await prisma.habilidade.findUnique({ 
            where: { Id_habilidade: id } 
        })

        if (!habilidade) {
            res.status(404).json({ erro: 'Habilidade não cadastrada' })
            return
        }

        res.status(200).json(habilidade)
    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: 'Erro interno do servidor' })
    }
})

router.post("/", async (req, res) => {
    const valida = habilidadeSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { Nome_habilidade, Descricao, Tipo, Nivel_necessario, Pontos_necessarios } = valida.data

    try {
        const habilidade = await prisma.habilidade.create({
            data: { Nome_habilidade, Descricao, Tipo, Nivel_necessario, Pontos_necessarios  }
        })
        res.status(201).json(habilidade)
    } catch (error) {
        res.status(500).json({ error })
    }
})

router.put("/:Id_habilidade", async (req, res) => {
    const { Id_habilidade } = req.params

    const valida = habilidadeSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    const { Nome_habilidade, Descricao, Tipo, Nivel_necessario, Pontos_necessarios } = valida.data

    try {
        const habilidade = await prisma.habilidade.update({
            where: { Id_habilidade: Number(Id_habilidade) },
            data: { Nome_habilidade, Descricao, Tipo, Nivel_necessario, Pontos_necessarios }
        })
        res.status(200).json(habilidade)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.delete("/:Id_habilidade", async (req, res) => {
    const { Id_habilidade } = req.params

    try {
        const habilidade = await prisma.habilidade.delete({
            where: { Id_habilidade: Number(Id_habilidade) }
        })
        res.status(200).json(habilidade)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

export default router