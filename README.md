# Totally Baked Pemba — Plataforma Oficial de Encomendas, Catering & Rastreio GPS

Plataforma web de encomendas online, catering corporativo, bolos de celebração e rastreio GPS em tempo real para a **Totally Baked Pemba** (*Rua da ANE, Bairro Alto Gingone, Pemba, Cabo Delgado*).

## Funcionalidades de Produção
- **Identidade Autêntica & Editorial**: Tema branco luminoso com tipografia *Moret Variable* & *Feline*, paleta oficial (`#FF70B0`, `#FFA0CA`, `#FFC4DE`, `#FFECF5`) e conteúdos completos dos 6 serviços oficiais (Padaria, Pastelaria & Bolos, Cafetaria, Sorvetes Artesanais, Refeições e Catering).
- **Motion & Transições GSAP (Estilo Henrietta)**: Cortina de entrada com contador (`00% -> 100%`), transições de página em dupla camada (`#FF70B0` + `#FFECF5`), revelação tipográfica por palavra com máscara, links rolantes `[stagger-link]` e ícones vetoriais SVG animados.
- **Fluxo Comercial Completo em Pemba**:
  - **Entrega ao Domicílio** com cálculo automático por bairro/GPS em Pemba e entrega grátis em encomendas ≥ **1.500 MZN**.
  - **Levantamento na Loja (0 MZN)** diretamente na *Rua da ANE, Bairro Alto Gingone*.
  - **Pagamentos Moçambicanos**: M-Pesa (Vodacom), E-Mola (Movitel), POS/Cartão e Numerário com cálculo de troco.
  - **Confirmação Pós-Checkout & Recibo**: Página `/rastreio/:id?confirmed=1&t=...` com mapa Leaflet ao vivo, recibo imprimível e botão direto para o WhatsApp oficial (`+258 84 595 8546`).
  - **Catering & Bolos de Festa**: Modal dedicado (`POST /api/catering`) para orçamentos empresariais e eventos.
- **Arquitetura Resiliente para Vercel Serverless**:
  - Entrypoint Serverless em `api/index.ts` + configuração `vercel.json`.
  - Persistência híbrida em `/tmp` + **Token Criptográfico Stateless HMAC (`?t=...`)** garantindo que links de rastreio funcionem mesmo entre diferentes instâncias Serverless.

## Executar Localmente

```bash
npm install
npm run build
npm start
```

Para executar a suíte de verificação automatizada (26 asserções):

```bash
npm run build
node dist/test_verification.js
```

## Hospedagem na Vercel

1. Instale a Vercel CLI ou conecte o repositório Git no painel da Vercel:
   ```bash
   npx vercel
   ```
2. Configure (opcionalmente) as variáveis de ambiente no painel da Vercel (**Settings → Environment Variables**):
   - `ORDER_TOKEN_SECRET`: Segredo HMAC para assinar tokens stateless de rastreio.
   - `ADMIN_PIN`: PIN opcional para proteger o painel da cozinha (`/admin?pin=SEU_PIN`).
   - `PUBLIC_URL`: Domínio público final (ex.: `https://totallybaked.co.mz` — detectado automaticamente se omitido).
3. Publique em produção:
   ```bash
   npx vercel --prod
   ```
