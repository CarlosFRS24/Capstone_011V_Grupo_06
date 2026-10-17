export const environment = {
  // Backend Spring Boot. En emulador Android usa http://10.0.2.2:8080; en celular real, la IP de tu PC.
  apiUrl: 'http://localhost:8080/api/v1',
  // Intervalo de refresco del panel admin (RNF: cambios de bahía visibles en <= 3 s)
  pollAdminMs: 3000,
  pollAppMs: 5000,
  // Minutos que dura una reserva. Debe coincidir con RESERVA_MINUTOS del backend.
  reservaMinutos: 15,
};

//apiUrl: 'http://localhost:8080/api/v1',
