/**
 * Utilidades para validar formularios
 */

const Validator = {
    /**
     * Validar campo requerido
     */
    required(value, fieldName = 'Este campo') {
        if (!value || value.toString().trim() === '') {
            return `${fieldName} es obligatorio`;
        }
        return null;
    },

    /**
     * Validar email
     */
    email(value) {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Email inválido';
        }
        return null;
    },

    /**
     * Validar longitud mínima
     */
    minLength(value, min, fieldName = 'Este campo') {
        if (!value) return null;
        if (value.length < min) {
            return `${fieldName} debe tener al menos ${min} caracteres`;
        }
        return null;
    },

    /**
     * Validar longitud máxima
     */
    maxLength(value, max, fieldName = 'Este campo') {
        if (!value) return null;
        if (value.length > max) {
            return `${fieldName} no puede tener más de ${max} caracteres`;
        }
        return null;
    },

    /**
     * Validar número
     */
    numeric(value, fieldName = 'Este campo') {
        if (!value) return null;
        if (isNaN(value)) {
            return `${fieldName} debe ser un número válido`;
        }
        return null;
    },

    /**
     * Validar número positivo
     */
    positive(value, fieldName = 'Este campo') {
        if (!value) return null;
        if (parseFloat(value) <= 0) {
            return `${fieldName} debe ser mayor a 0`;
        }
        return null;
    },

    /**
     * Validar valor mínimo
     */
    min(value, minValue, fieldName = 'Este campo') {
        if (!value) return null;
        if (parseFloat(value) < minValue) {
            return `${fieldName} debe ser mayor o igual a ${minValue}`;
        }
        return null;
    },

    /**
     * Validar valor máximo
     */
    max(value, maxValue, fieldName = 'Este campo') {
        if (!value) return null;
        if (parseFloat(value) > maxValue) {
            return `${fieldName} debe ser menor o igual a ${maxValue}`;
        }
        return null;
    },

    /**
     * Validar formato de precio (2 decimales)
     */
    price(value, fieldName = 'Precio') {
        if (!value) return null;
        const priceRegex = /^\d+(\.\d{1,2})?$/;
        if (!priceRegex.test(value)) {
            return `${fieldName} inválido (formato: 0.00)`;
        }
        return null;
    },

    /**
     * Mostrar error en el DOM
     */
    showError(inputElement, message) {
        // Remover error previo
        this.clearError(inputElement);
        
        // Agregar clase de error
        inputElement.classList.add('is-invalid');
        
        // Crear elemento de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        
        // Insertar después del input
        inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
    },

    /**
     * Limpiar error del DOM
     */
    clearError(inputElement) {
        inputElement.classList.remove('is-invalid');
        const errorDiv = inputElement.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
            errorDiv.remove();
        }
    },

    /**
     * Validar formulario completo
     */
    validateForm(formElement) {
        let isValid = true;
        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            const error = this.required(input.value, input.name || 'Este campo');
            if (error) {
                this.showError(input, error);
                isValid = false;
            } else {
                this.clearError(input);
            }
        });
        
        return isValid;
    }
};