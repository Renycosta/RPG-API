import express from 'express'
const app = express()
const port = 3000

import routesPersonagens from "./routes/personagens"
import routesDepositos from "./routes/depositos"
import routesProdutos from "./routes/produtos"
import routesVendas from "./routes/vendas"

app.use(express.json())

app.use("/personagens", routesPersonagens)
app.use("/depositos", routesDepositos)
app.use("/produtos", routesProdutos)
app.use("/vendas", routesVendas)

app.get('/', (req, res) => {
  res.send('API: Sistema de Controle de habilidades de RPG')
})

app.listen(port, () => {
  console.log(`Servidor Rodando na Porta: ${port}`)
})
