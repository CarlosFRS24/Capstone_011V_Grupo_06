export const environment = {
  // Backend Spring Boot. En emulador Android usa http://10.0.2.2:8080; en celular real, la IP de tu PC.
  apiUrl: 'http://localhost:8080/api/v1',
  // Intervalo de refresco del panel admin (RNF: cambios de bahía visibles en <= 3 s)
  pollAdminMs: 3000,
  pollAppMs: 5000,
  // Minutos que dura una reserva. El valor real lo entrega el backend en /mi-estado;
  // este solo se usa mientras carga. Debe coincidir con RESERVA_MINUTOS del backend.
  reservaMinutos: 60,
  // Cada cuánto la app consulta faltas, lista de espera y avisos
  pollEstadoMs: 15000,
};

//apiUrl: 'http://localhost:8080/api/v1',
