<?php
/**
 * Clases Conexion y Modelo - AluGestión
 * Mantiene la misma arquitectura y métodos del proyecto de referencia
 */

require_once 'config.php';

class Conexion {
    // Propiedades
    protected $db;

    // Método constructor
    public function __construct() {
        $this->db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

        if ($this->db->connect_errno) {
            header("Content-Type: application/json; charset=utf-8");
            echo json_encode([
                'success' => false,
                'message' => 'Fallo al conectar a MySQL: ' . $this->db->connect_error
            ]);
            exit;
        }

        $this->db->set_charset(DB_CHARSET);
        $this->db->query("SET NAMES 'utf8mb4'");
    }

    public function getDb() {
        return $this->db;
    }
}

/**
 * Clase Modelo basada en la clase Conexion
 */
class Modelo extends Conexion {
    // Propiedades
    private $tabla;         // Nombre de la tabla
    private $id = 0;        // id del registro
    private $criterio = ''; // Criterio para las consultas WHERE
    private $campos = '*';  // Lista de campos
    private $orden = 'id DESC'; // Campos de ordenamiento por defecto
    private $limite = 0;    // Cantidad de registros
    
    public function __construct($tabla) {
        parent::__construct();
        $this->tabla = $this->db->real_escape_string($tabla);
    }

    // Métodos Getter y Setter
    public function getId() {
        return $this->id;
    }
    public function setId($id) {
        $this->id = intval($id);
    }
    public function getCriterio() {
        return $this->criterio;
    }
    public function setCriterio($criterio) {
        $this->criterio = $criterio;
    }
    public function getCampos() {
        return $this->campos;
    }
    public function setCampos($campos) {
        $this->campos = $campos;
    }
    public function getOrden() {
        return $this->orden;
    }
    public function setOrden($orden) {
        $this->orden = $orden;
    }
    public function getLimite() {
        return $this->limite;
    }
    public function setLimite($limite) {
        $this->limite = intval($limite);
    }

    /**
     * Método de selección
     * Permite seleccionar registros de una tabla de BD
     * @return array $resultado
     */
    public function seleccionar() {
        $sql = "SELECT $this->campos FROM $this->tabla";
        
        if ($this->criterio != '') {
            $sql .= " WHERE $this->criterio";
        }
        
        if ($this->orden != '') {
            $sql .= " ORDER BY $this->orden";
        }
        
        if ($this->limite > 0) {
            $sql .= " LIMIT $this->limite";
        }

        $resultado = $this->db->query($sql);
        return $resultado ? $resultado->fetch_all(MYSQLI_ASSOC) : [];
    }

    /**
     * Inserta un registro en la BD
     * @param array $datos: los datos a insertar
     * @return int $id: el id del registro insertado o 0 si falla
     */
    public function insertar($datos) {
        if (isset($datos['id'])) {
            unset($datos['id']);
        }

        if (isset($datos['password'])) {
            $password_plano = $datos['password'];
            $datos['password'] = password_hash($password_plano, PASSWORD_DEFAULT);
        }

        $escaped_campos = [];
        $escaped_valores = [];

        foreach ($datos as $columna => $valor) {
            $col_limpia = preg_replace('/[^a-zA-Z0-9_]/', '', $columna);
            if ($col_limpia === '') continue;
            
            $escaped_campos[] = "`$col_limpia`";
            if ($valor === null) {
                $escaped_valores[] = "NULL";
            } else {
                $escaped_val = $this->db->real_escape_string((string)$valor);
                $escaped_valores[] = "'$escaped_val'";
            }
        }

        $campos_str = implode(", ", $escaped_campos);
        $valores_str = implode(", ", $escaped_valores);

        $sql = "INSERT INTO $this->tabla ($campos_str) VALUES ($valores_str)";

        if ($this->db->query($sql)) {
            return $this->db->insert_id;
        } else {
            return 0;
        }
    }

    /**
     * Actualiza un registro en la BD
     * @param array $datos: los datos a modificar
     * @return bool
     */
    public function actualizar($datos) {
        if (isset($datos['id'])) {
            unset($datos['id']);
        }

        if (isset($datos['password']) && !empty($datos['password'])) {
            $datos['password'] = password_hash($datos['password'], PASSWORD_DEFAULT);
        } else if (isset($datos['password']) && empty($datos['password'])) {
            unset($datos['password']);
        }

        $actualizaciones = [];
        foreach ($datos as $key => $value) {
            $col_limpia = preg_replace('/[^a-zA-Z0-9_]/', '', $key);
            if ($col_limpia === '') continue;
            
            if ($value === null) {
                $actualizaciones[] = "`$col_limpia` = NULL";
            } else {
                $escaped_val = $this->db->real_escape_string((string)$value);
                $actualizaciones[] = "`$col_limpia` = '$escaped_val'";
            }
        }

        if (empty($actualizaciones)) {
            return false;
        }

        $sql = "UPDATE $this->tabla SET " . implode(", ", $actualizaciones) . " WHERE $this->criterio";
        return (bool)$this->db->query($sql);
    }

    /**
     * Elimina un registro de la BD
     * @return bool
     */
    public function eliminar() {
        if (empty($this->criterio)) {
            return false;
        }
        $sql = "DELETE FROM $this->tabla WHERE $this->criterio";
        return (bool)$this->db->query($sql);
    }

    /**
     * Ejecuta una consulta personalizada de conteo / agregación
     */
    public function consultarSql($sql) {
        $resultado = $this->db->query($sql);
        return $resultado ? $resultado->fetch_all(MYSQLI_ASSOC) : [];
    }
}
?>
